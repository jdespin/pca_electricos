import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SessionRepository {
  SessionRepository._();
  static final SessionRepository instance = SessionRepository._();

  static const _keyCedula = 'session_cedula';
  static const _keyRememberedPassword = 'remembered_password';
  static const _keyIdUsuario = 'session_id_usuario';
  static const _keyRoles = 'session_roles';
  static const _keyPerfilCache = 'perfil_cache';

  Future<void> saveSession(String cedula) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyCedula, cedula);
  }

  Future<String?> getSavedCedula() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyCedula);
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyCedula);
  }

  Future<void> saveRememberedPassword(String password) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyRememberedPassword, password);
  }

  Future<String?> getRememberedPassword() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyRememberedPassword);
  }

  Future<void> clearRememberedPassword() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyRememberedPassword);
  }

  Future<void> saveIdUsuario(int id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyIdUsuario, id);
  }

  Future<int?> getIdUsuario() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_keyIdUsuario);
  }

  Future<void> clearIdUsuario() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyIdUsuario);
  }

  Future<void> saveRoles(List<String> roles) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_keyRoles, roles);
  }

  Future<List<String>> getRoles() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_keyRoles) ?? [];
  }

  Future<void> clearRoles() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyRoles);
  }

  Future<void> savePerfilCache(Map<String, dynamic> perfil) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPerfilCache, jsonEncode(perfil));
  }

  Future<Map<String, dynamic>?> getPerfilCache() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyPerfilCache);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> clearPerfilCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPerfilCache);
  }
}
