import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const isVercel = process.env.VERCEL === "1";
const isRender = process.env.RENDER === "true";
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// Interface to unify better-sqlite3 and libsql
interface DbClient {
  prepare: (sql: string) => any;
  exec: (sql: string) => Promise<any>;
}

let db: DbClient;

if (tursoUrl && tursoToken) {
  // Use Turso (Cloud SQLite) - 100% Free and Persistent
  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  db = {
    prepare: (sql: string) => ({
      run: async (...args: any[]) => {
        try {
          return await client.execute({ sql, args });
        } catch (e) {
          console.error("Turso Run Error:", e);
          throw e;
        }
      },
      get: async (...args: any[]) => {
        try {
          const res = await client.execute({ sql, args });
          return res.rows[0];
        } catch (e) {
          console.error("Turso Get Error:", e);
          return null;
        }
      },
      all: async (...args: any[]) => {
        try {
          const res = await client.execute({ sql, args });
          return res.rows;
        } catch (e) {
          console.error("Turso All Error:", e);
          return [];
        }
      }
    }),
    exec: (sql: string) => client.execute(sql),
  } as any;
} else {
  // Use Local LibSQL (compatible with Turso client)
  let dbPath = "database.db";
  if (isVercel) {
    dbPath = path.join("/tmp", "database.db");
  } else if (isRender && fs.existsSync("/data")) {
    dbPath = path.join("/data", "database.db");
  }
  
  const client = createClient({
    url: `file:${dbPath}`,
  });

  db = {
    prepare: (sql: string) => ({
      run: async (...args: any[]) => client.execute({ sql, args }),
      get: async (...args: any[]) => {
        const res = await client.execute({ sql, args });
        return res.rows[0];
      },
      all: async (...args: any[]) => {
        const res = await client.execute({ sql, args });
        return res.rows;
      }
    }),
    exec: (sql: string) => client.execute(sql),
  } as any;
}

export const initDb = async () => {
  console.log("Iniciando inicialização do banco de dados...");
  
  const calculatePrice = (type: string, days: number) => {
    if (type === 'Isento') return 0;
    if (type === 'Adolescente') {
      const prices = { 1: 75, 2: 150, 3: 185, 4: 200 };
      return prices[days as keyof typeof prices] || 0;
    }
    if (type === 'Adulto') {
      const prices = { 1: 150, 2: 300, 3: 370, 4: 400 };
      return prices[days as keyof typeof prices] || 0;
    }
    return 0;
  };

  const seedParticipants = [
    { lider: "Josué Souza", nome: "Josué Souza", tipo: "Adulto", idade: 30, dias: 4 },
    { lider: "Josué Souza", nome: "Laiane", tipo: "Adulto", idade: 28, dias: 4 },
    { lider: "Elivânia", nome: "Elivânia", tipo: "Adulto", idade: 35, dias: 4 },
    { lider: "Elivânia", nome: "Toniel", tipo: "Adulto", idade: 40, dias: 4 },
    { lider: "Elivânia", nome: "Estela", tipo: "Adolescente", idade: 15, dias: 4 },
    { lider: "Vanessa", nome: "Vanessa", tipo: "Adulto", idade: 33, dias: 4 },
    { lider: "Vanessa", nome: "Nicole", tipo: "Adulto", idade: 29, dias: 4 },
    { lider: "Vanessa", nome: "Juan", tipo: "Adolescente", idade: 12, dias: 4 },
    { lider: "Vanessa", nome: "Stefani", tipo: "Adolescente", idade: 16, dias: 4 },
    { lider: "Paulo", nome: "Paulo", tipo: "Adulto", idade: 45, dias: 3 },
    { lider: "Paulo", nome: "Silmara", tipo: "Adulto", idade: 41, dias: 3 },
    { lider: "Elisângela", nome: "Elisângela", tipo: "Adulto", idade: 38, dias: 4 },
    { lider: "Elisângela", nome: "Kammilly", tipo: "Adolescente", idade: 14, dias: 4 },
    { lider: "Elisângela", nome: "Orlando", tipo: "Adulto", idade: 39, dias: 4 },
    { lider: "Elizabete", nome: "Elizabete", tipo: "Adulto", idade: 50, dias: 4 },
    { lider: "Elizabete", nome: "Mario", tipo: "Adulto", idade: 52, dias: 4 },
    { lider: "Vanderson", nome: "Vanderson", tipo: "Adulto", idade: 31, dias: 4 },
    { lider: "Vanderson", nome: "Tamiris", tipo: "Adulto", idade: 27, dias: 4 },
    { lider: "Vanderson", nome: "Heitor", tipo: "Adolescente", idade: 11, dias: 4 },
    { lider: "Tamili", nome: "Tamili", tipo: "Adulto", idade: 26, dias: 4 },
    { lider: "Tamili", nome: "Douglas", tipo: "Adulto", idade: 30, dias: 4 },
    { lider: "Elizete", nome: "Elizete", tipo: "Adulto", idade: 48, dias: 4 },
    { lider: "Elizete", nome: "Elias", tipo: "Adulto", idade: 50, dias: 4 },
    { lider: "Vitória Paixão", nome: "Vitória Paixão", tipo: "Adulto", idade: 22, dias: 2 },
    { lider: "Wilde", nome: "Wilde", tipo: "Adulto", idade: 34, dias: 4 },
    { lider: "Wilde", nome: "Huliana", tipo: "Adulto", idade: 32, dias: 4 },
    { lider: "Wilde", nome: "Ilana", tipo: "Adolescente", idade: 13, dias: 4 },
    { lider: "Wesley", nome: "Wesley", tipo: "Adulto", idade: 25, dias: 4 },
    { lider: "Priscilla", nome: "Priscilla", tipo: "Adulto", idade: 36, dias: 4 },
    { lider: "Eliana", nome: "Eliana", tipo: "Adulto", idade: 44, dias: 2 },
    { lider: "Eliana", nome: "Renato", tipo: "Adulto", idade: 46, dias: 2 },
    { lider: "Daiana", nome: "Daiana", tipo: "Adulto", idade: 35, dias: 4 },
    { lider: "Daiana", nome: "Emerson", tipo: "Adulto", idade: 38, dias: 4 },
    { lider: "Daiana", nome: "Gabriel", tipo: "Adolescente", idade: 17, dias: 4 },
    { lider: "Daiana", nome: "Vitória", tipo: "Adolescente", idade: 10, dias: 4 },
    { lider: "Daiana", nome: "Larissa", tipo: "Adulto", idade: 19, dias: 4 },
  ];

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE,
        senha TEXT,
        tipo_usuario TEXT DEFAULT 'participante',
        lider_familia TEXT DEFAULT 'nao'
      );

      CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lider TEXT NOT NULL,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        idade INTEGER NOT NULL,
        dias INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      );

      CREATE TABLE IF NOT EXISTS pagamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        valor REAL NOT NULL,
        data_pagamento TEXT NOT NULL,
        arquivo_comprovante TEXT,
        status_validacao TEXT DEFAULT 'validado',
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      );

      CREATE TABLE IF NOT EXISTS financeiro (
        usuario_id INTEGER PRIMARY KEY,
        valor_total REAL DEFAULT 0,
        valor_pago REAL DEFAULT 0,
        saldo REAL DEFAULT 0,
        status TEXT DEFAULT 'Pendente',
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      );
    `);
    console.log("Tabelas verificadas/criadas.");

    const checkRes = await db.prepare("SELECT COUNT(*) as count FROM usuarios").get();
    const checkSeeded = checkRes ? (checkRes.count ?? checkRes['COUNT(*)'] ?? 0) : 0;

    console.log(`Usuários encontrados no banco: ${checkSeeded}`);

    if (Number(checkSeeded) === 0) {
      console.log("Banco vazio. Iniciando seeding de dados oficiais...");
      const insertUser = db.prepare("INSERT INTO usuarios (nome, tipo_usuario, lider_familia) VALUES (?, ?, ?)");
      const insertPart = db.prepare("INSERT INTO participantes (lider, nome, tipo, idade, dias, valor_total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const insertFin = db.prepare("INSERT INTO financeiro (usuario_id, valor_total, valor_pago, saldo, status) VALUES (?, ?, ?, ?, ?)");

      await insertUser.run("Administrador", "admin", "nao");

      const leaders = new Map();
      for (const p of seedParticipants) {
        if (!leaders.has(p.lider)) {
          const res = await insertUser.run(p.lider, "participante", "sim");
          const lastId = res.lastInsertRowid || res.lastInsertId || (res.rowsAffected > 0 ? leaders.size + 2 : null); 
          
          let actualId = lastId;
          if (!actualId) {
            const newUser = await db.prepare("SELECT id FROM usuarios WHERE nome = ?").get(p.lider);
            actualId = newUser?.id;
          }

          leaders.set(p.lider, actualId);
          await insertFin.run(actualId, 0, 0, 0, "Pendente");
        }
        const userId = leaders.get(p.lider);
        const valorTotal = calculatePrice(p.tipo, p.dias);
        await insertPart.run(p.lider, p.nome, p.tipo, p.idade, p.dias, valorTotal, userId);
        await db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
          .run(valorTotal, valorTotal, userId);
      }
      console.log("Seeding de participantes concluído.");
    }
  } catch (err) {
    console.error("Erro durante initDb:", err);
    throw err;
  }

  // Seed Official Payments
  const officialPayments = [
    { lider: "Josué Souza", valor: 100, data: "2026-01-16" },
    { lider: "Elivânia", valor: 100, data: "2026-01-17" },
    { lider: "Elivânia", valor: 100, data: "2026-02-06" },
    { lider: "Vanessa", valor: 100, data: "2026-01-16" },
    { lider: "Vanessa", valor: 100, data: "2026-02-16" },
    { lider: "Paulo", valor: 100, data: "2026-01-16" },
    { lider: "Elisângela", valor: 100, data: "2026-01-16" },
    { lider: "Elisângela", valor: 100, data: "2026-02-12" },
    { lider: "Elizabete", valor: 100, data: "2026-01-16" },
    { lider: "Elizabete", valor: 50, data: "2026-02-03" },
    { lider: "Vanderson", valor: 100, data: "2026-01-16" },
    { lider: "Vanderson", valor: 100, data: "2026-01-30" },
    { lider: "Tamili", valor: 100, data: "2026-01-16" },
    { lider: "Tamili", valor: 50, data: "2026-02-03" },
    { lider: "Elizete", valor: 25, data: "2026-01-16" },
    { lider: "Elizete", valor: 50, data: "2026-01-31" },
    { lider: "Vitória Paixão", valor: 50, data: "2026-01-16" },
    { lider: "Wilde", valor: 70, data: "2026-01-16" },
    { lider: "Wilde", valor: 85, data: "2026-01-30" },
    { lider: "Wesley", valor: 60, data: "2026-01-16" },
    { lider: "Wesley", valor: 35, data: "2026-01-30" },
    { lider: "Priscilla", valor: 20, data: "2026-01-30" },
    { lider: "Eliana", valor: 100, data: "2026-02-03" },
    { lider: "Daiana", valor: 200, data: "2026-02-11" },
  ];

  // Only seed payments if none exist to avoid duplicates on cloud
  const payCountRes = await db.prepare("SELECT COUNT(*) as count FROM pagamentos").get();
  const payCount = payCountRes.count || payCountRes['COUNT(*)'];
  
  if (payCount === 0) {
    for (const pay of officialPayments) {
      const user = await db.prepare("SELECT id FROM usuarios WHERE nome = ?").get(pay.lider);
      if (user) {
        const userId = user.id;
        await db.prepare("INSERT INTO pagamentos (usuario_id, valor, data_pagamento) VALUES (?, ?, ?)")
          .run(userId, pay.valor, pay.data);
        
        await db.prepare(`
          UPDATE financeiro 
          SET valor_pago = valor_pago + ?, 
              saldo = valor_total - (valor_pago + ?),
              status = CASE 
                WHEN (valor_total - (valor_pago + ?)) <= 0 THEN 'Quitado'
                WHEN (valor_pago + ?) > 0 THEN 'Parcial'
                ELSE 'Pendente'
              END
          WHERE usuario_id = ?
        `).run(pay.valor, pay.valor, pay.valor, pay.valor, userId);
      }
    }
  }
};

export default db;
