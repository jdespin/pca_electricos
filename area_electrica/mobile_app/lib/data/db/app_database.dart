import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

class AppDatabase {
  AppDatabase._();
  static final AppDatabase instance = AppDatabase._();

  static const _dbName = 'pca_app.db';
  static const _dbVersion = 13;

  Database? _db;

  Future<Database> get db async {
    if (_db != null) return _db!;
    _db = await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final basePath = await getDatabasesPath();
    final path = p.join(basePath, _dbName);

    return openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE technicians (
            idusuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            usuario_strnombre TEXT NOT NULL UNIQUE,
            celular TEXT NOT NULL,
            tipo_sangre TEXT NOT NULL,
            usuario_strclave TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE work_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idorden_backend INTEGER,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('proceso','finalizada','evaluada')),
            tipo TEXT NOT NULL DEFAULT 'inspeccion',
            tecnico_id INTEGER,
            es_lider INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            calificacion TEXT,
            observacion TEXT,
            sincronizado INTEGER NOT NULL DEFAULT 0,
            supervisor_nombre TEXT
          );
        ''');
        await db.execute('''
          CREATE TABLE order_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            observaciones TEXT NOT NULL DEFAULT '',
            materiales TEXT NOT NULL DEFAULT '',
            trabajo_realizado TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE order_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            photo_path TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE equipment_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            equipment_type TEXT NOT NULL,
            potencia TEXT NOT NULL DEFAULT '',
            serial TEXT NOT NULL DEFAULT '',
            marca TEXT NOT NULL DEFAULT '',
            caf TEXT NOT NULL DEFAULT '',
            observaciones TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE equipment_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            equipment_type TEXT NOT NULL,
            photo_label TEXT NOT NULL DEFAULT '',
            is_required INTEGER NOT NULL DEFAULT 0,
            photo_path TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE equipos_internos_cache (
            idequipointerno INTEGER PRIMARY KEY,
            strequipo TEXT NOT NULL DEFAULT '',
            strserie TEXT NOT NULL DEFAULT '',
            strmarca TEXT NOT NULL DEFAULT '',
            strmodelo TEXT NOT NULL DEFAULT '',
            strdescripcion TEXT,
            strimagen TEXT,
            strdisponibilidad TEXT NOT NULL DEFAULT 'Libre',
            cached_at INTEGER NOT NULL
          );
        ''');
        await db.execute('''
          CREATE TABLE uso_equipo_cache (
            iduso INTEGER PRIMARY KEY,
            idequipointerno INTEGER NOT NULL,
            strequipo TEXT NOT NULL DEFAULT '',
            strserie TEXT NOT NULL DEFAULT '',
            strmarca TEXT NOT NULL DEFAULT '',
            strmodelo TEXT NOT NULL DEFAULT '',
            strimagen TEXT,
            dtfechainicio TEXT NOT NULL,
            idusuario INTEGER NOT NULL,
            cached_at INTEGER NOT NULL
          );
        ''');
        await db.execute('CREATE INDEX idx_technicians_usuario_strnombre ON technicians(usuario_strnombre);');
        await db.execute('CREATE INDEX idx_work_orders_status ON work_orders(status);');
        await db.execute('CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);');
        await db.execute('CREATE INDEX idx_order_reports_order_id ON order_reports(order_id);');
        await db.execute('CREATE INDEX idx_order_photos_order_id ON order_photos(order_id);');
        await db.execute('CREATE INDEX idx_equipment_reports_order ON equipment_reports(order_id);');
        await db.execute('CREATE INDEX idx_equipment_photos_order ON equipment_photos(order_id, equipment_type);');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await db.execute(
            "ALTER TABLE technicians ADD COLUMN password TEXT NOT NULL DEFAULT '';",
          );
        }
        if (oldVersion < 3) {
          await db.execute('''
            CREATE TABLE technicians_new (
              idusuario INTEGER PRIMARY KEY AUTOINCREMENT,
              nombre TEXT NOT NULL,
              apellido TEXT NOT NULL,
              usuario_strnombre TEXT NOT NULL UNIQUE,
              celular TEXT NOT NULL,
              tipo_sangre TEXT NOT NULL,
              usuario_strclave TEXT NOT NULL DEFAULT '',
              created_at INTEGER NOT NULL
            );
          ''');
          await db.execute('''
            INSERT INTO technicians_new (idusuario, nombre, apellido, usuario_strnombre, celular, tipo_sangre, usuario_strclave, created_at)
            SELECT id, nombre, apellido, cedula, celular, tipo_sangre, password, created_at FROM technicians;
          ''');
          await db.execute('DROP TABLE technicians;');
          await db.execute('ALTER TABLE technicians_new RENAME TO technicians;');
          await db.execute('CREATE INDEX idx_technicians_usuario_strnombre ON technicians(usuario_strnombre);');
        }
        if (oldVersion < 4) {
          await db.execute(
            "ALTER TABLE work_orders ADD COLUMN tipo TEXT NOT NULL DEFAULT 'inspeccion';",
          );
        }
        if (oldVersion < 5) {
          await db.execute('ALTER TABLE work_orders ADD COLUMN tecnico_id INTEGER;');
          await db.execute('''
            CREATE TABLE order_reports (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL,
              observaciones TEXT NOT NULL DEFAULT '',
              materiales TEXT NOT NULL DEFAULT '',
              trabajo_realizado TEXT NOT NULL DEFAULT '',
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            );
          ''');
          await db.execute('''
            CREATE TABLE order_photos (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL,
              photo_path TEXT NOT NULL,
              created_at INTEGER NOT NULL
            );
          ''');
          await db.execute('CREATE INDEX idx_order_reports_order_id ON order_reports(order_id);');
          await db.execute('CREATE INDEX idx_order_photos_order_id ON order_photos(order_id);');
        }
        if (oldVersion < 6) {
          await db.execute('ALTER TABLE order_photos ADD COLUMN latitude REAL;');
          await db.execute('ALTER TABLE order_photos ADD COLUMN longitude REAL;');
        }
        if (oldVersion < 8) {
          await db.execute(
            'ALTER TABLE work_orders ADD COLUMN es_lider INTEGER NOT NULL DEFAULT 1;',
          );
        }
        if (oldVersion < 9) {
          await db.execute(
            'ALTER TABLE work_orders ADD COLUMN idorden_backend INTEGER;',
          );
        }
        if (oldVersion < 10) {
          await db.execute('ALTER TABLE work_orders ADD COLUMN calificacion TEXT;');
          await db.execute('ALTER TABLE work_orders ADD COLUMN observacion TEXT;');
        }
        if (oldVersion < 11) {
          await db.execute('ALTER TABLE work_orders ADD COLUMN sincronizado INTEGER NOT NULL DEFAULT 0;');
        }
        if (oldVersion < 12) {
          await db.execute('ALTER TABLE work_orders ADD COLUMN supervisor_nombre TEXT;');
        }
        if (oldVersion < 13) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS equipos_internos_cache (
              idequipointerno INTEGER PRIMARY KEY,
              strequipo TEXT NOT NULL DEFAULT '',
              strserie TEXT NOT NULL DEFAULT '',
              strmarca TEXT NOT NULL DEFAULT '',
              strmodelo TEXT NOT NULL DEFAULT '',
              strdescripcion TEXT,
              strimagen TEXT,
              strdisponibilidad TEXT NOT NULL DEFAULT 'Libre',
              cached_at INTEGER NOT NULL
            );
          ''');
          await db.execute('''
            CREATE TABLE IF NOT EXISTS uso_equipo_cache (
              iduso INTEGER PRIMARY KEY,
              idequipointerno INTEGER NOT NULL,
              strequipo TEXT NOT NULL DEFAULT '',
              strserie TEXT NOT NULL DEFAULT '',
              strmarca TEXT NOT NULL DEFAULT '',
              strmodelo TEXT NOT NULL DEFAULT '',
              strimagen TEXT,
              dtfechainicio TEXT NOT NULL,
              idusuario INTEGER NOT NULL,
              cached_at INTEGER NOT NULL
            );
          ''');
        }
        if (oldVersion < 7) {
          await db.execute('''
            CREATE TABLE equipment_reports (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL,
              equipment_type TEXT NOT NULL,
              potencia TEXT NOT NULL DEFAULT '',
              serial TEXT NOT NULL DEFAULT '',
              marca TEXT NOT NULL DEFAULT '',
              caf TEXT NOT NULL DEFAULT '',
              observaciones TEXT NOT NULL DEFAULT '',
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            );
          ''');
          await db.execute('''
            CREATE TABLE equipment_photos (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL,
              equipment_type TEXT NOT NULL,
              photo_label TEXT NOT NULL DEFAULT '',
              is_required INTEGER NOT NULL DEFAULT 0,
              photo_path TEXT NOT NULL,
              latitude REAL,
              longitude REAL,
              created_at INTEGER NOT NULL
            );
          ''');
          await db.execute('CREATE INDEX idx_equipment_reports_order ON equipment_reports(order_id);');
          await db.execute('CREATE INDEX idx_equipment_photos_order ON equipment_photos(order_id, equipment_type);');
        }
      },
    );
  }

  Future<void> close() async {
    final database = _db;
    if (database != null) {
      await database.close();
      _db = null;
    }
  }
}
