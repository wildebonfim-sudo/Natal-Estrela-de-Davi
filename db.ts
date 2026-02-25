import Database from "better-sqlite3";

const db = new Database("database.db");

export const initDb = () => {
  db.exec(`
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

  const checkSeeded = db.prepare("SELECT COUNT(*) as count FROM participantes").get().count;
  if (checkSeeded === 0) {
    const insertUser = db.prepare("INSERT INTO usuarios (nome, tipo_usuario, lider_familia) VALUES (?, ?, ?)");
    const insertPart = db.prepare("INSERT INTO participantes (lider, nome, tipo, idade, dias, valor_total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertFin = db.prepare("INSERT INTO financeiro (usuario_id, valor_total, valor_pago, saldo, status) VALUES (?, ?, ?, ?, ?)");

    insertUser.run("Administrador", "admin", "nao");

    const leaders = new Map();
    seedParticipants.forEach(p => {
      if (!leaders.has(p.lider)) {
        const res = insertUser.run(p.lider, "participante", "sim");
        leaders.set(p.lider, res.lastInsertRowid);
        insertFin.run(res.lastInsertRowid, 0, 0, 0, "Pendente");
      }
      const userId = leaders.get(p.lider);
      const valorTotal = calculatePrice(p.tipo, p.dias);
      insertPart.run(p.lider, p.nome, p.tipo, p.idade, p.dias, valorTotal, userId);
      db.prepare("UPDATE financeiro SET valor_total = valor_total + ?, saldo = saldo + ? WHERE usuario_id = ?")
        .run(valorTotal, valorTotal, userId);
    });
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

  // Clear existing payments and reset financeiro to ensure official data is correct
  db.prepare("DELETE FROM pagamentos").run();
  db.prepare("UPDATE financeiro SET valor_pago = 0, saldo = valor_total, status = 'Pendente'").run();

  officialPayments.forEach(pay => {
    const user = db.prepare("SELECT id FROM usuarios WHERE nome = ?").get(pay.lider) as any;
    if (user) {
      db.prepare("INSERT INTO pagamentos (usuario_id, valor, data_pagamento) VALUES (?, ?, ?)")
        .run(user.id, pay.valor, pay.data);
      
      // Update financeiro
      db.prepare(`
        UPDATE financeiro 
        SET valor_pago = valor_pago + ?, 
            saldo = valor_total - (valor_pago + ?),
            status = CASE 
              WHEN (valor_total - (valor_pago + ?)) <= 0 THEN 'Quitado'
              WHEN (valor_pago + ?) > 0 THEN 'Parcial'
              ELSE 'Pendente'
            END
        WHERE usuario_id = ?
      `).run(pay.valor, pay.valor, pay.valor, pay.valor, user.id);
    }
  });
};

export default db;
