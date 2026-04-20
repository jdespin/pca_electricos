import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:sqflite/sqflite.dart';
import '../db/app_database.dart';
import 'auth_repository.dart';
import 'session_repository.dart';

class EquipoInterno {
  final int idequipointerno;
  final String strequipo;
  final String strserie;
  final String strmarca;
  final String strmodelo;
  final String? strdescripcion;
  final String? strimagen;
  final String strdisponibilidad;

  const EquipoInterno({
    required this.idequipointerno,
    required this.strequipo,
    required this.strserie,
    required this.strmarca,
    required this.strmodelo,
    this.strdescripcion,
    this.strimagen,
    required this.strdisponibilidad,
  });

  factory EquipoInterno.fromJson(Map<String, dynamic> json) => EquipoInterno(
        idequipointerno: json['idequipointerno'] as int,
        strequipo: json['strequipo'] as String? ?? '',
        strserie: json['strserie'] as String? ?? '',
        strmarca: json['strmarca'] as String? ?? '',
        strmodelo: json['strmodelo'] as String? ?? '',
        strdescripcion: json['strdescripcion'] as String?,
        strimagen: json['strimagen'] as String?,
        strdisponibilidad: json['strdisponibilidad'] as String? ?? 'Libre',
      );

  Map<String, dynamic> toMap(int cachedAt) => {
        'idequipointerno': idequipointerno,
        'strequipo': strequipo,
        'strserie': strserie,
        'strmarca': strmarca,
        'strmodelo': strmodelo,
        'strdescripcion': strdescripcion,
        'strimagen': strimagen,
        'strdisponibilidad': strdisponibilidad,
        'cached_at': cachedAt,
      };

  static EquipoInterno fromMap(Map<String, dynamic> m) => EquipoInterno(
        idequipointerno: m['idequipointerno'] as int,
        strequipo: m['strequipo'] as String? ?? '',
        strserie: m['strserie'] as String? ?? '',
        strmarca: m['strmarca'] as String? ?? '',
        strmodelo: m['strmodelo'] as String? ?? '',
        strdescripcion: m['strdescripcion'] as String?,
        strimagen: m['strimagen'] as String?,
        strdisponibilidad: m['strdisponibilidad'] as String? ?? 'Libre',
      );
}

class UsoEquipoActivo {
  final int iduso;
  final int idequipointerno;
  final String strequipo;
  final String strserie;
  final String strmarca;
  final String strmodelo;
  final String? strimagen;
  final DateTime dtfechainicio;

  const UsoEquipoActivo({
    required this.iduso,
    required this.idequipointerno,
    required this.strequipo,
    required this.strserie,
    required this.strmarca,
    required this.strmodelo,
    this.strimagen,
    required this.dtfechainicio,
  });

  factory UsoEquipoActivo.fromJson(Map<String, dynamic> json) => UsoEquipoActivo(
        iduso: json['iduso'] as int,
        idequipointerno: json['idequipointerno'] as int,
        strequipo: json['strequipo'] as String? ?? '',
        strserie: json['strserie'] as String? ?? '',
        strmarca: json['strmarca'] as String? ?? '',
        strmodelo: json['strmodelo'] as String? ?? '',
        strimagen: json['strimagen'] as String?,
        dtfechainicio: DateTime.tryParse(json['dtfechainicio'] as String? ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap(int idusuario, int cachedAt) => {
        'iduso': iduso,
        'idequipointerno': idequipointerno,
        'strequipo': strequipo,
        'strserie': strserie,
        'strmarca': strmarca,
        'strmodelo': strmodelo,
        'strimagen': strimagen,
        'dtfechainicio': dtfechainicio.toIso8601String(),
        'idusuario': idusuario,
        'cached_at': cachedAt,
      };

  static UsoEquipoActivo fromMap(Map<String, dynamic> m) => UsoEquipoActivo(
        iduso: m['iduso'] as int,
        idequipointerno: m['idequipointerno'] as int,
        strequipo: m['strequipo'] as String? ?? '',
        strserie: m['strserie'] as String? ?? '',
        strmarca: m['strmarca'] as String? ?? '',
        strmodelo: m['strmodelo'] as String? ?? '',
        strimagen: m['strimagen'] as String?,
        dtfechainicio: DateTime.tryParse(m['dtfechainicio'] as String? ?? '') ?? DateTime.now(),
      );
}

class EquipoInternoRepository {
  EquipoInternoRepository._();
  static final EquipoInternoRepository instance = EquipoInternoRepository._();

  static const String _base = AuthRepository.baseUrl;

  Future<void> _saveEquiposLibresCache(List<EquipoInterno> lista) async {
    final Database db = await AppDatabase.instance.db;
    final now = DateTime.now().millisecondsSinceEpoch;
    final batch = db.batch();
    batch.delete('equipos_internos_cache');
    for (final e in lista) {
      batch.insert('equipos_internos_cache', e.toMap(now),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<EquipoInterno>> _getCachedEquiposLibres() async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query('equipos_internos_cache',
        orderBy: 'strequipo ASC');
    return rows.map(EquipoInterno.fromMap).toList();
  }

  Future<void> _saveMisEquiposCache(
      List<UsoEquipoActivo> lista, int idusuario) async {
    final Database db = await AppDatabase.instance.db;
    final now = DateTime.now().millisecondsSinceEpoch;
    final batch = db.batch();
    batch.delete('uso_equipo_cache',
        where: 'idusuario = ?', whereArgs: [idusuario]);
    for (final e in lista) {
      batch.insert('uso_equipo_cache', e.toMap(idusuario, now),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<UsoEquipoActivo>> _getCachedMisEquipos(int idusuario) async {
    final Database db = await AppDatabase.instance.db;
    final rows = await db.query('uso_equipo_cache',
        where: 'idusuario = ?',
        whereArgs: [idusuario],
        orderBy: 'dtfechainicio DESC');
    return rows.map(UsoEquipoActivo.fromMap).toList();
  }

  Future<({List<EquipoInterno> libres, List<UsoEquipoActivo> mios})>
      preloadFromCache() async {
    final idusuario = await SessionRepository.instance.getIdUsuario();
    final libres = await _getCachedEquiposLibres();
    final mios = idusuario != null
        ? await _getCachedMisEquipos(idusuario)
        : <UsoEquipoActivo>[];
    return (libres: libres, mios: mios);
  }

  Future<({List<EquipoInterno> datos, bool offline})> fetchEquiposLibres() async {
    try {
      final uri = Uri.parse('$_base/rutaequipointerno/EquiposLibres');
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));
      if (resp.statusCode == 200) {
        final body = jsonDecode(resp.body) as Map<String, dynamic>;
        final lista = (body['datos'] as List<dynamic>? ?? [])
            .map((e) => EquipoInterno.fromJson(e as Map<String, dynamic>))
            .toList();
        await _saveEquiposLibresCache(lista);
        return (datos: lista, offline: false);
      }
    } catch (_) {}
    final cached = await _getCachedEquiposLibres();
    return (datos: cached, offline: true);
  }

  Future<({List<UsoEquipoActivo> datos, bool offline})>
      fetchMisEquiposActivos() async {
    try {
      final idusuario = await SessionRepository.instance.getIdUsuario();
      if (idusuario == null) return (datos: <UsoEquipoActivo>[], offline: false);
      final uri =
          Uri.parse('$_base/rutaequipointerno/MiEquipoActivo/$idusuario');
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));
      if (resp.statusCode == 200) {
        final body = jsonDecode(resp.body) as Map<String, dynamic>;
        final lista = (body['datos'] as List<dynamic>? ?? [])
            .map((e) => UsoEquipoActivo.fromJson(e as Map<String, dynamic>))
            .toList();
        await _saveMisEquiposCache(lista, idusuario);
        return (datos: lista, offline: false);
      }
      final cached = await _getCachedMisEquipos(idusuario);
      return (datos: cached, offline: true);
    } catch (_) {
      final idusuario = await SessionRepository.instance.getIdUsuario();
      if (idusuario == null) return (datos: <UsoEquipoActivo>[], offline: true);
      final cached = await _getCachedMisEquipos(idusuario);
      return (datos: cached, offline: true);
    }
  }

  Future<bool> reservarEquipo(int idequipointerno, String strnombretecnico) async {
    try {
      final idusuario = await SessionRepository.instance.getIdUsuario();
      final uri = Uri.parse('$_base/rutaequipointerno/ReservarEquipo');
      final resp = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idequipointerno': idequipointerno,
          'idusuario': idusuario,
          'strnombretecnico': strnombretecnico,
        }),
      ).timeout(const Duration(seconds: 10));
      if (resp.statusCode != 200) return false;
      final body = jsonDecode(resp.body) as Map<String, dynamic>;
      return body['success'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> devolverEquipo(int idequipointerno) async {
    try {
      final idusuario = await SessionRepository.instance.getIdUsuario();
      final uri = Uri.parse('$_base/rutaequipointerno/DevolverEquipo');
      final resp = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idequipointerno': idequipointerno,
          'idusuario': idusuario,
        }),
      ).timeout(const Duration(seconds: 10));
      if (resp.statusCode != 200) return false;
      final body = jsonDecode(resp.body) as Map<String, dynamic>;
      return body['success'] == true;
    } catch (_) {
      return false;
    }
  }
}
