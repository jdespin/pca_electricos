import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_profile.dart';
import 'session_repository.dart';

class LoginResult {
  final int? idUsuario;
  final List<String> roles;
  final String? mensaje;

  const LoginResult({this.idUsuario, this.roles = const [], this.mensaje});

  bool get success => idUsuario != null;
}

class AuthRepository {
  AuthRepository._();
  static final AuthRepository instance = AuthRepository._();

  
  static const String baseUrl  = 'http://192.168.0.68:3001/wselectricos';
  static const String _baseUrl = baseUrl;

  
  Future<LoginResult> login({
    required String usuario,
    required String password,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/rutalogin/LoginApp/${Uri.encodeComponent(usuario)}/${Uri.encodeComponent(password)}/movil');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final rawRoles = (data['roles'] as List<dynamic>? ?? []);
          final roles = rawRoles
              .map((r) => (r['rol_nombre'] as String?) ?? (r['rol_strnombre'] as String?) ?? '')
              .where((n) => n.isNotEmpty)
              .toList();
          return LoginResult(idUsuario: data['idUsuario'] as int?, roles: roles);
        } else {
          return LoginResult(mensaje: data['mensaje'] as String?);
        }
      }
      return LoginResult(mensaje: 'Error HTTP ${response.statusCode}');
    } catch (e) {
      return LoginResult(mensaje: 'Error: ${e.runtimeType} - $e');
    }
  }

  Future<UserProfile?> fetchPerfil(int idUsuario) async {
    try {
      final uri = Uri.parse('$_baseUrl/rutausuario/PerfilUsuario/$idUsuario');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final map = data['dato'] as Map<String, dynamic>;
          await SessionRepository.instance.savePerfilCache(map);
          return UserProfile.fromMap(map);
        }
      }
    } catch (_) {}

    final cached = await SessionRepository.instance.getPerfilCache();
    if (cached != null) return UserProfile.fromMap(cached);
    return null;
  }
}
