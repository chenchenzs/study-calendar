import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import initData from '../utils/initData';


const dbVersion = '0.0.1'; // 每次发布加一位 控制用户localstorage数据更新

if (localStorage.getItem('dbVersion') !== dbVersion) {  // 版本更新时清空数据 --> 或者把用户操作过的数据单独存起来?
  localStorage.removeItem('myDatabase');
  localStorage.removeItem('dbVersion');
}

const SQL = await initSqlJs({
  locateFile: () => sqlWasmUrl // 指定WASM文件路径
});


const base64 = localStorage.getItem('myDatabase');
const data = base64 ? Uint8Array.from(atob(base64), c => c.charCodeAt(0)) : null;
const db = !base64 ? new SQL.Database() : new SQL.Database(data); // 创建内存数据库

db.run(`
  CREATE TABLE IF NOT EXISTS calendar(
    id TEXT PRIMARY KEY, 
    year INTEGER, 
    month INTEGER, 
    day INTEGER,
    data TEXT)`);

if (!localStorage.getItem('myDatabase') && !localStorage.getItem('dbVersion')) {
  initBaseData(); // 版本号且数据为空时 初始化数据
}

function initBaseData() {

  db.run("BEGIN TRANSACTION");

  try {
    // 准备语句
    const stmt = db.prepare(`
      INSERT INTO calendar (id, year, month, day, data) 
      VALUES (?, ?, ?, ?, ?)
    `);

    // 循环执行（所有操作在一个事务中）
    initData.forEach(item => {
      stmt.run([
        item.id,
        item.year,
        item.month,
        item.day,
        JSON.stringify(item.data)  // 序列化内层数组
      ]);
    });

    // 释放语句
    stmt.free();

    // 提交事务
    db.run("COMMIT");

  } catch (error) {
    // 出错时回滚
    db.run("ROLLBACK");
    console.error("插入失败:", error);
    throw error;
  }
  localStorage.setItem('dbVersion', dbVersion);
  saveDatabase();
}

function saveDatabase() {
  const data = db.export(); // 获取 Uint8Array
  const binaryString = Array.from(data, byte => String.fromCharCode(byte as number)).join('');
  localStorage.setItem('myDatabase', btoa(binaryString)); // Base64编码
  console.log('数据已保存到 localStorage');
  // db.close();
}


export function postCalendarData(params: { id: string, year: number, month: number, day: number, data: string }) {

  const isClean = params.data?.length === 0;

  const upsertSQL = `INSERT INTO calendar(id, year, month, day, data) VALUES(?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET data=excluded.data`;

  const deleteSQL = `DELETE FROM calendar WHERE id = ?`;

  isClean
    ? db.run(deleteSQL, [params.id])
    : db.run(upsertSQL, [params.id, params.year, params.month, params.day, JSON.stringify(params.data)]);
  saveDatabase();
  return { success: true, code: 200 };
}

export function getCalendarData(params: { year: number; month: number }) {

  const stmt = db.prepare(
    `SELECT id, year, month, day, data 
   FROM calendar 
   WHERE year = ? AND month = ? 
   ORDER BY day ASC`
  );

  stmt.bind([params.year, params.month]);

  // 获取所有结果
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.data = JSON.parse(row.data as string || '[]');
    results.push(row);
  }

  // 释放资源
  stmt.free();
  if (results.length === 0) localStorage.removeItem('myDatabase');
  return results || [];
}

