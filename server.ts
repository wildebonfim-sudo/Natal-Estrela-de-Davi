import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import db, { initDb } from "./db.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

async function startServer() {
  try {
    await initDb();
    console.log("Banco de dados inicializado com sucesso.");
  } catch (error) {
    console.error("Erro fatal ao inicializar banco de dados:", error);
  }
  
  // Simplified Routes (No Login)
  app.get("/api/users", async (req, res) => {
    const users = await db.prepare("SELECT * FROM usuarios").all();
    res.json(users);
  });

  app.get("/api/user/:id", async (req, res) => {
    const user = await db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.get("/api/user/:id/family", async (req, res) => {
    const family = await db.prepare("SELECT * FROM participantes WHERE usuario_id = ?").all(req.params.id);
    res.json(family);
  });

  app.get("/api/user/:id/finance", async (req, res) => {
    const finance = await db.prepare("SELECT * FROM financeiro WHERE usuario_id = ?").get(req.params.id);
    res.json(finance);
  });

  app.get("/api/user/:id/payments", async (req, res) => {
    const payments = await db.prepare("SELECT * FROM pagamentos WHERE usuario_id = ? ORDER BY data_pagamento DESC").all(req.params.id);
    res.json(payments);
  });

  const calculatePrice = (type: string, days: number) => {
    if (type === 'exempt' || type === 'Isento') return 0;
    if (type === 'teen' || type === 'Adolescente') {
      const prices: any = { 1: 75, 2: 150, 3: 185, 4: 200 };
      return prices[days] || 0;
    }
    if (type === 'adult' || type === 'Adulto') {
      const prices: any = { 1: 150, 2: 300, 3: 370, 4: 400 };
      return prices[days] || 0;
    }
    return 0;
  };

  app.post("/api/user/:id/add-member", async (req, res) => {
    const { nome, idade, dias, tipo } = req.body;
    const usuarioId = req.params.id;
    try {
      const user = await db.prepare("SELECT nome FROM usuarios WHERE id = ?").get(usuarioId) as any;
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      const valorTotal = calculatePrice(tipo, dias);
      await db.prepare("INSERT INTO participantes (lider, nome, tipo, idade, dias, valor_total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(user.nome, nome, tipo, idade, dias, valorTotal, usuarioId);

      // Update financeiro
      await db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
        .run(valorTotal, valorTotal, usuarioId);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao adicionar membro" });
    }
  });

  app.delete("/api/participant/:id", async (req, res) => {
    try {
      const part = await db.prepare("SELECT * FROM participantes WHERE id = ?").get(req.params.id) as any;
      if (!part) return res.status(404).json({ error: "Participante não encontrado" });

      await db.prepare("DELETE FROM participantes WHERE id = ?").run(req.params.id);

      // Update financeiro
      await db.prepare("UPDATE financeiro SET valor_total = valor_total - ?, saldo = saldo - ? WHERE usuario_id = ?")
        .run(part.valor_total, part.valor_total, part.usuario_id);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao remover membro" });
    }
  });

  app.patch("/api/participant/:id", async (req, res) => {
    const { idade, nome } = req.body;
    try {
      const part = await db.prepare("SELECT * FROM participantes WHERE id = ?").get(req.params.id) as any;
      if (!part) return res.status(404).json({ error: "Participante não encontrado" });

      const oldNome = part.nome;
      const usuarioId = part.usuario_id;

      // Check if this participant is the leader
      const user = await db.prepare("SELECT * FROM usuarios WHERE id = ?").get(usuarioId) as any;
      const isLeader = user && user.nome === oldNome;

      // Determine new type based on age
      let newTipo = part.tipo;
      let newValorTotal = part.valor_total;
      let diff = 0;

      if (idade !== undefined) {
        newTipo = 'Adulto';
        if (idade <= 9) newTipo = 'Isento';
        else if (idade <= 17) newTipo = 'Adolescente';

        newValorTotal = calculatePrice(newTipo, part.dias);
        diff = newValorTotal - part.valor_total;
      }

      await db.prepare("UPDATE participantes SET idade = ?, nome = ?, tipo = ?, valor_total = ? WHERE id = ?")
        .run(idade ?? part.idade, nome ?? part.nome, newTipo, newValorTotal, req.params.id);

      if (isLeader && nome && nome !== oldNome) {
        // Update leader name in usuarios table
        await db.prepare("UPDATE usuarios SET nome = ? WHERE id = ?").run(nome, usuarioId);
        // Update leader name in all participants of this family
        await db.prepare("UPDATE participantes SET lider = ? WHERE usuario_id = ?").run(nome, usuarioId);
      }

      if (diff !== 0) {
        // Update financeiro
        await db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
          .run(diff, diff, usuarioId);
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao atualizar participante" });
    }
  });

  app.get("/api/admin/families", async (req, res) => {
    const families = await db.prepare(`
      SELECT u.id, u.nome as lider, f.valor_total, f.valor_pago, f.saldo, f.status
      FROM usuarios u
      JOIN financeiro f ON u.id = f.usuario_id
      WHERE u.tipo_usuario = 'participante'
    `).all();

    const result = await Promise.all(families.map(async (f: any) => {
      const members = await db.prepare("SELECT * FROM participantes WHERE usuario_id = ?").all(f.id);
      const payments = await db.prepare("SELECT * FROM pagamentos WHERE usuario_id = ? ORDER BY data_pagamento DESC").all(f.id);
      return { ...f, members, payments };
    }));

    res.json(result);
  });

  app.post("/api/payments/save", async (req, res) => {
    const { userId, amount, date, receiptData } = req.body;
    try {
      await db.prepare("INSERT INTO pagamentos (usuario_id, valor, data_pagamento, arquivo_comprovante, visto_por_admin) VALUES (?, ?, ?, ?, 0)")
        .run(userId, amount, date, receiptData);
      
      // Get current finance to calculate new values accurately
      const fin = await db.prepare("SELECT * FROM financeiro WHERE usuario_id = ?").get(userId);
      if (fin) {
        const novoPago = (fin.valor_pago || 0) + amount;
        const novoSaldo = (fin.valor_total || 0) - novoPago;
        let novoStatus = 'Pendente';
        if (novoSaldo <= 0) novoStatus = 'Quitado';
        else if (novoPago > 0) novoStatus = 'Parcial';

        await db.prepare("UPDATE financeiro SET valor_pago = ?, saldo = ?, status = ? WHERE usuario_id = ?")
          .run(novoPago, novoSaldo, novoStatus, userId);
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao salvar pagamento" });
    }
  });

  app.post("/api/payments/:id/reject", async (req, res) => {
    try {
      const pay = await db.prepare("SELECT * FROM pagamentos WHERE id = ?").get(req.params.id) as any;
      if (!pay) return res.status(404).json({ error: "Pagamento não encontrado" });
      if (pay.status_validacao === 'rejeitado') return res.json({ success: true });

      await db.prepare("UPDATE pagamentos SET status_validacao = 'rejeitado', visto_por_admin = 1 WHERE id = ?").run(req.params.id);

      // Update financeiro (subtract the amount)
      const fin = await db.prepare("SELECT * FROM financeiro WHERE usuario_id = ?").get(pay.usuario_id) as any;
      if (fin) {
        const novoPago = Math.max(0, (fin.valor_pago || 0) - pay.valor);
        const novoSaldo = (fin.valor_total || 0) - novoPago;
        let novoStatus = 'Pendente';
        if (novoSaldo <= 0) novoStatus = 'Quitado';
        else if (novoPago > 0) novoStatus = 'Parcial';

        await db.prepare("UPDATE financeiro SET valor_pago = ?, saldo = ?, status = ? WHERE usuario_id = ?")
          .run(novoPago, novoSaldo, novoStatus, pay.usuario_id);
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao rejeitar pagamento" });
    }
  });

  app.post("/api/payments/:id/mark-seen", async (req, res) => {
    try {
      await db.prepare("UPDATE pagamentos SET visto_por_admin = 1 WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao marcar como visto" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const pay = await db.prepare("SELECT * FROM pagamentos WHERE id = ?").get(req.params.id) as any;
      if (!pay) return res.status(404).json({ error: "Pagamento não encontrado" });

      await db.prepare("DELETE FROM pagamentos WHERE id = ?").run(req.params.id);

      // Update financeiro (subtract the amount if it was validated or pending)
      // If it was rejected, we already subtracted it, so we don't subtract again.
      if (pay.status_validacao !== 'rejeitado') {
        const fin = await db.prepare("SELECT * FROM financeiro WHERE usuario_id = ?").get(pay.usuario_id) as any;
        if (fin) {
          const novoPago = Math.max(0, (fin.valor_pago || 0) - pay.valor);
          const novoSaldo = (fin.valor_total || 0) - novoPago;
          let novoStatus = 'Pendente';
          if (novoSaldo <= 0) novoStatus = 'Quitado';
          else if (novoPago > 0) novoStatus = 'Parcial';

          await db.prepare("UPDATE financeiro SET valor_pago = ?, saldo = ?, status = ? WHERE usuario_id = ?")
            .run(novoPago, novoSaldo, novoStatus, pay.usuario_id);
        }
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao excluir pagamento" });
    }
  });

  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const unread = await db.prepare(`
        SELECT p.*, u.nome as pagador 
        FROM pagamentos p 
        JOIN usuarios u ON p.usuario_id = u.id 
        WHERE p.visto_por_admin = 0 
        ORDER BY p.data_pagamento DESC
      `).all();
      res.json(unread);
    } catch (e) {
      res.status(500).json({ error: "Erro ao buscar notificações" });
    }
  });

  app.delete("/api/user/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      // Delete payments, participants, finance, and finally the user
      await db.prepare("DELETE FROM pagamentos WHERE usuario_id = ?").run(userId);
      await db.prepare("DELETE FROM participantes WHERE usuario_id = ?").run(userId);
      await db.prepare("DELETE FROM financeiro WHERE usuario_id = ?").run(userId);
      await db.prepare("DELETE FROM usuarios WHERE id = ?").run(userId);
      
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao excluir família" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    const statsRes = await db.prepare("SELECT SUM(valor_pago) as sum FROM financeiro").get();
    const balancesRes = await db.prepare("SELECT SUM(saldo) as sum FROM financeiro").get();
    const participantsRes = await db.prepare("SELECT COUNT(*) as count FROM participantes WHERE tipo != 'Isento'").get();
    
    const totalCollected = statsRes.sum || 0;
    // Falta para a Meta do Sítio (16.000)
    const totalPending = Math.max(0, 16000 - totalCollected);
    // Total que as famílias ainda devem (Soma de todos os saldos individuais)
    const totalToReceiveFromFamilies = balancesRes.sum || 0;
    const totalParticipants = participantsRes.count;
    
    res.json({ 
      totalCollected, 
      totalPending, 
      totalToReceiveFromFamilies, 
      vagasOcupadas: totalParticipants, 
      vagasTotais: 55 
    });
  });

  app.get("/api/admin/participants", async (req, res) => {
    const participants = await db.prepare(`
      SELECT p.*, f.valor_pago, f.saldo, f.status as finance_status
      FROM participantes p
      JOIN financeiro f ON p.usuario_id = f.usuario_id
    `).all();
    res.json(participants);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  // In AI Studio/Local, we MUST use port 3000. In Render, we use process.env.PORT.
  const finalPort = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3000) : 3000;
  
  app.listen(finalPort, "0.0.0.0", () => {
    console.log(`Server running on port ${finalPort}`);
  });
}

startServer();

export default app;
