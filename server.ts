import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import db, { initDb } from "./db.ts";

dotenv.config();
initDb();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

async function startServer() {
  // Simplified Routes (No Login)
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM usuarios").all();
    res.json(users);
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.get("/api/user/:id/family", (req, res) => {
    const family = db.prepare("SELECT * FROM participantes WHERE usuario_id = ?").all(req.params.id);
    res.json(family);
  });

  app.get("/api/user/:id/finance", (req, res) => {
    const finance = db.prepare("SELECT * FROM financeiro WHERE usuario_id = ?").get(req.params.id);
    res.json(finance);
  });

  app.get("/api/user/:id/payments", (req, res) => {
    const payments = db.prepare("SELECT * FROM pagamentos WHERE usuario_id = ? ORDER BY data_pagamento DESC").all(req.params.id);
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

  app.post("/api/user/:id/add-member", (req, res) => {
    const { nome, idade, dias, tipo } = req.body;
    const usuarioId = req.params.id;
    try {
      const user = db.prepare("SELECT nome FROM usuarios WHERE id = ?").get(usuarioId) as any;
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      const valorTotal = calculatePrice(tipo, dias);
      db.prepare("INSERT INTO participantes (lider, nome, tipo, idade, dias, valor_total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(user.nome, nome, tipo, idade, dias, valorTotal, usuarioId);

      // Update financeiro
      db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
        .run(valorTotal, valorTotal, usuarioId);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao adicionar membro" });
    }
  });

  app.delete("/api/participant/:id", (req, res) => {
    try {
      const part = db.prepare("SELECT * FROM participantes WHERE id = ?").get(req.params.id) as any;
      if (!part) return res.status(404).json({ error: "Participante não encontrado" });

      db.prepare("DELETE FROM participantes WHERE id = ?").run(req.params.id);

      // Update financeiro
      db.prepare("UPDATE financeiro SET valor_total = valor_total - ?, saldo = saldo - ? WHERE usuario_id = ?")
        .run(part.valor_total, part.valor_total, part.usuario_id);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao remover membro" });
    }
  });

  app.patch("/api/participant/:id", (req, res) => {
    const { idade } = req.body;
    try {
      const part = db.prepare("SELECT * FROM participantes WHERE id = ?").get(req.params.id) as any;
      if (!part) return res.status(404).json({ error: "Participante não encontrado" });

      // Determine new type based on age
      let newTipo = 'Adulto';
      if (idade <= 9) newTipo = 'Isento';
      else if (idade <= 17) newTipo = 'Adolescente';

      const newValorTotal = calculatePrice(newTipo, part.dias);
      const diff = newValorTotal - part.valor_total;

      db.prepare("UPDATE participantes SET idade = ?, tipo = ?, valor_total = ? WHERE id = ?")
        .run(idade, newTipo, newValorTotal, req.params.id);

      // Update financeiro
      db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
        .run(diff, diff, part.usuario_id);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao atualizar idade" });
    }
  });

  app.get("/api/admin/families", (req, res) => {
    const families = db.prepare(`
      SELECT u.id, u.nome as lider, f.valor_total, f.valor_pago, f.saldo, f.status
      FROM usuarios u
      JOIN financeiro f ON u.id = f.usuario_id
      WHERE u.tipo_usuario = 'participante'
    `).all();

    const result = families.map((f: any) => {
      const members = db.prepare("SELECT * FROM participantes WHERE usuario_id = ?").all(f.id);
      const payments = db.prepare("SELECT * FROM pagamentos WHERE usuario_id = ? ORDER BY data_pagamento DESC").all(f.id);
      return { ...f, members, payments };
    });

    res.json(result);
  });

  app.post("/api/payments/save", (req, res) => {
    const { userId, amount, date } = req.body;
    try {
      db.prepare("INSERT INTO pagamentos (usuario_id, valor, data_pagamento) VALUES (?, ?, ?)")
        .run(userId, amount, date);
      
      db.prepare(`
        UPDATE financeiro 
        SET valor_pago = valor_pago + ?, 
            saldo = saldo - ?,
            status = CASE 
              WHEN (saldo - ?) <= 0 THEN 'Quitado'
              WHEN (valor_pago + ?) > 0 THEN 'Parcial'
              ELSE 'Pendente'
            END
        WHERE usuario_id = ?
      `).run(amount, amount, amount, amount, userId);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao salvar pagamento" });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalCollected = db.prepare("SELECT SUM(valor_pago) as sum FROM financeiro").get().sum || 0;
    const totalPending = db.prepare("SELECT SUM(saldo) as sum FROM financeiro").get().sum || 0;
    const totalParticipants = db.prepare("SELECT COUNT(*) as count FROM participantes WHERE tipo != 'Isento'").get().count;
    res.json({ totalCollected, totalPending, vagasOcupadas: totalParticipants, vagasTotais: 55 });
  });

  app.get("/api/admin/participants", (req, res) => {
    const participants = db.prepare(`
      SELECT p.*, f.valor_pago, f.saldo, f.status as finance_status
      FROM participantes p
      JOIN financeiro f ON p.usuario_id = f.usuario_id
    `).all();
    res.json(participants);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
  } else {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }
}

startServer();

export default app;
