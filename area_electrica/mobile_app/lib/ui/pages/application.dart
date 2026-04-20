import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../data/models/user_profile.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/session_repository.dart';
import 'home_page.dart';
import 'profile_page.dart';
import 'notification_page.dart';
import 'sync_page.dart';

class Application extends StatefulWidget {
  const Application({super.key});

  @override
  State<Application> createState() => _ApplicationState();
}

class _ApplicationState extends State<Application> {
  int _index = 0;
  int _unreadCount = 0;
  UserProfile? _perfil;

  static const _baseUrl = AuthRepository.baseUrl;

  @override
  void initState() {
    super.initState();
    _cargarPerfil();
    _fetchUnreadCount();
  }

  Future<void> _cargarPerfil() async {
    final idUsuario = await SessionRepository.instance.getIdUsuario();
    if (idUsuario == null) return;

    final cached = await SessionRepository.instance.getPerfilCache();
    if (cached != null && mounted) {
      setState(() => _perfil = UserProfile.fromMap(cached));
    }

    final perfil = await AuthRepository.instance.fetchPerfil(idUsuario);
    if (mounted && perfil != null) setState(() => _perfil = perfil);
  }

  Future<void> _fetchUnreadCount() async {
    final idUsuario = await SessionRepository.instance.getIdUsuario();
    if (idUsuario == null) return;
    try {
      final uri = Uri.parse('$_baseUrl/rutanotificacion/NotificacionesUsuario/$idUsuario');
      final resp = await http.get(uri).timeout(const Duration(seconds: 5));
      if (!mounted) return;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final lista = data['datos'] as List<dynamic>? ?? [];
      final count = lista.where((n) => !(n['boolleida'] as bool? ?? false)).length;
      if (_index != 1) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  void _onTabChanged(int i) {
    if (i == 1) {
      setState(() { _index = i; _unreadCount = 0; });
    } else {
      if (_index == 1) _fetchUnreadCount();
      setState(() => _index = i);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomePage(
        nombre: _perfil?.strnombres ?? '',
        apellido: _perfil?.strapellidos ?? '',
      ),
      const NotificationPage(),
      const SyncPage(),
      ProfilePage(
        nombre: _perfil?.strnombres ?? '',
        apellido: _perfil?.strapellidos ?? '',
        cedula: _perfil?.strcedula ?? '',
        celular: _perfil?.strcelular1 ?? '',
        tipoSangre: _perfil?.strtiposangre ?? '',
        correo: _perfil?.strcorreo1 ?? '',
      ),
    ];

    return Scaffold(
      body: pages[_index],
      bottomNavigationBar: _BottomNav(
        currentIndex: _index,
        onTap: _onTabChanged,
        unreadCount: _unreadCount,
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.currentIndex, required this.onTap, this.unreadCount = 0});

  final int currentIndex;
  final ValueChanged<int> onTap;
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    const selected = Color(0xFF0A2E5C);
    const unselected = Color(0xFF9EAFC2);
    const bgColor = Colors.white;

    final items = [
      (Icons.home_rounded, Icons.home_outlined, 'Inicio'),
      (Icons.notifications_rounded, Icons.notifications_outlined,
          'Notificaciones'),
      (Icons.sync_rounded, Icons.sync_outlined, 'Sincronizar'),
      (Icons.person_rounded, Icons.person_outlined, 'Perfil'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: List.generate(items.length, (i) {
              final isActive = i == currentIndex;
              final (activeIcon, inactiveIcon, label) = items[i];

              return Expanded(
                child: InkWell(
                  onTap: () => onTap(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(
                            isActive ? activeIcon : inactiveIcon,
                            color: isActive ? selected : unselected,
                            size: 24,
                          ),
                          if (i == 1 && unreadCount > 0)
                            Positioned(
                              top: -4,
                              right: -6,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  unreadCount > 99 ? '99+' : '$unreadCount',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: isActive
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: isActive ? selected : unselected,
                        ),
                      ),
                      const SizedBox(height: 2),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        height: 3,
                        width: isActive ? 20 : 0,
                        decoration: BoxDecoration(
                          color: selected,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
