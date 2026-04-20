import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/session_repository.dart';
import '../../data/repositories/work_order_repository.dart';
import '../../data/repositories/equipment_report_repository.dart';
import 'orden_equipos_form_page.dart';


class _NotificationItem {
  final int id;
  final int? idorden;
  final String title;
  final String message;
  final String time;
  final String tipo; 
  bool unread;

  _NotificationItem({
    required this.id,
    this.idorden,
    required this.title,
    required this.message,
    required this.time,
    this.tipo = 'inspeccion',
    required this.unread,
  });
}


class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  static const _baseUrl = AuthRepository.baseUrl;

  List<_NotificationItem> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchNotificaciones();
  }

  Future<void> _fetchNotificaciones() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final idUsuario = await SessionRepository.instance.getIdUsuario();
      if (!mounted) return;
      if (idUsuario == null) {
        setState(() { _loading = false; _items = []; });
        return;
      }

      final uri = Uri.parse('$_baseUrl/rutanotificacion/NotificacionesUsuario/$idUsuario');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final lista = (data['datos'] as List<dynamic>? ?? []);
        setState(() {
          _items = lista.map((n) => _NotificationItem(
            id: n['idnotificacion'] as int,
            idorden: n['idorden'] as int?,
            title: (n['strtitulo'] as String?) ?? 'Notificación',
            message: (n['strmensaje'] as String?) ?? '',
            time: (n['fechacreacion'] as String?) ?? '',
            tipo: (n['strtipo'] as String?) ?? 'inspeccion',
            unread: !(n['boolleida'] as bool? ?? false),
          )).toList();
          _loading = false;
        });
      } else {
        setState(() { _loading = false; _error = 'Error al cargar notificaciones'; });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() { _loading = false; _error = 'Sin conexión al servidor'; });
    }
  }

  Future<void> _markRead(int id) async {
    try {
      final uri = Uri.parse('$_baseUrl/rutanotificacion/MarcarLeida/$id');
      await http.put(uri).timeout(const Duration(seconds: 5));
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      for (final item in _items) {
        if (item.id == id) item.unread = false;
      }
    });
  }

  Future<void> _onTapNotificacion(_NotificationItem item) async {
    _markRead(item.id);
    if (item.idorden == null || !mounted) return;

    final uri = Uri.parse('$_baseUrl/rutaorden/DetalleOrden/${item.idorden}');
    try {
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));
      if (!mounted) return;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        _mostrarResumenOrden(data['dato'] as Map<String, dynamic>);
      }
    } catch (_) {}
  }

  void _mostrarResumenOrden(Map<String, dynamic> dato) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OrdenResumenSheet(
        dato: dato,
        baseUrl: _baseUrl,
        onIrFormulario: (orden) async {
          final saved = await EquipmentReportRepository.instance
              .listByOrderId(orden.id!);
          final preselected = saved.map((r) => r.equipmentType).toList();
          if (!mounted) return;
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => EquiposSelectionSheet(
              orden: orden,
              preselected: preselected,
              onConfirm: (equipos) {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        OrdenEquiposFormPage(orden: orden, equipos: equipos),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _markAllRead() {
    for (final item in _items.where((n) => n.unread).toList()) {
      _markRead(item.id);
    }
  }

  void _delete(int id) {
    setState(() => _items.removeWhere((n) => n.id == id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Notificación eliminada'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _clearAll() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Limpiar notificaciones',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text(
            '¿Eliminar todas las notificaciones de la vista?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0A2E5C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              setState(() => _items.clear());
            },
            child: const Text('Eliminar todo'),
          ),
        ],
      ),
    );
  }

  int get _unreadCount => _items.where((n) => n.unread).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: Column(
        children: [
          _NotifHeader(
            unreadCount: _unreadCount,
            hasItems: _items.isNotEmpty,
            onMarkAllRead: _unreadCount > 0 ? _markAllRead : null,
            onClearAll: _items.isNotEmpty ? _clearAll : null,
            onRefresh: _fetchNotificaciones,
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF0A2E5C)))
                : _error != null
                    ? _ErrorState(
                        message: _error!, onRetry: _fetchNotificaciones)
                    : _items.isEmpty
                        ? const _EmptyState()
                        : RefreshIndicator(
                            color: const Color(0xFF0A2E5C),
                            onRefresh: _fetchNotificaciones,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              itemCount: _items.length,
                              itemBuilder: (context, i) {
                                final n = _items[i];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Dismissible(
                                    key: ValueKey(n.id),
                                    direction: DismissDirection.endToStart,
                                    background: _DismissBackground(),
                                    onDismissed: (_) => _delete(n.id),
                                    child: _NotificationCard(
                                      item: n,
                                      onTap: () => _onTapNotificacion(n),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}


class _NotifHeader extends StatelessWidget {
  const _NotifHeader({
    required this.unreadCount,
    required this.hasItems,
    required this.onMarkAllRead,
    required this.onClearAll,
    required this.onRefresh,
  });

  final int unreadCount;
  final bool hasItems;
  final VoidCallback? onMarkAllRead;
  final VoidCallback? onClearAll;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2E5C), Color(0xFF1A5FA8)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 20, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.notifications_rounded,
                      color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  const Text(
                    'Notificaciones',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (unreadCount > 0) ...[
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF5252),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  IconButton(
                    onPressed: onRefresh,
                    icon: Icon(Icons.refresh_rounded,
                        color: Colors.white.withValues(alpha: 0.8)),
                    tooltip: 'Actualizar',
                  ),
                  if (hasItems)
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert_rounded,
                          color: Colors.white.withValues(alpha: 0.8)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      onSelected: (v) {
                        if (v == 'read') onMarkAllRead?.call();
                        if (v == 'clear') onClearAll?.call();
                      },
                      itemBuilder: (_) => [
                        if (unreadCount > 0)
                          const PopupMenuItem(
                            value: 'read',
                            child: Row(children: [
                              Icon(Icons.done_all_rounded,
                                  size: 18, color: Color(0xFF0A2E5C)),
                              SizedBox(width: 10),
                              Text('Marcar todo como leído'),
                            ]),
                          ),
                        const PopupMenuItem(
                          value: 'clear',
                          child: Row(children: [
                            Icon(Icons.delete_sweep_outlined,
                                size: 18, color: Colors.red),
                            SizedBox(width: 10),
                            Text('Limpiar notificaciones',
                                style: TextStyle(color: Colors.red)),
                          ]),
                        ),
                      ],
                    ),
                ],
              ),
              if (unreadCount > 0) ...[
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: onMarkAllRead,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.done_all_rounded,
                          size: 15,
                          color: Colors.white.withValues(alpha: 0.7)),
                      const SizedBox(width: 6),
                      Text(
                        'Marcar todo como leído',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 13,
                          decoration: TextDecoration.underline,
                          decorationColor:
                              Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}


class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item, required this.onTap});

  final _NotificationItem item;
  final VoidCallback onTap;

  static Color _tipoColor(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return const Color(0xFF0EA5E9);
      case 'instalacion':   return const Color(0xFF8B5CF6);
      default:              return const Color(0xFFEF4444);
    }
  }

  static IconData _tipoIcon(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return Icons.build_outlined;
      case 'instalacion':   return Icons.electrical_services_outlined;
      default:              return Icons.search_outlined;
    }
  }

  static String _tipoLabel(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return 'Mantenimiento';
      case 'instalacion':   return 'Instalación';
      default:              return 'Inspección';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _tipoColor(item.tipo);

    return Material(
      color: item.unread ? Colors.white : const Color(0xFFF9FAFB),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Icon(_tipoIcon(item.tipo), color: color, size: 22),
                  ),
                  if (item.unread)
                    Positioned(
                      right: 2,
                      top: 2,
                      child: Container(
                        width: 9,
                        height: 9,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFF5252),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _tipoLabel(item.tipo),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: color,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          item.time,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.title,
                      style: TextStyle(
                        fontWeight:
                            item.unread ? FontWeight.w700 : FontWeight.w600,
                        fontSize: 14,
                        color: const Color(0xFF1A2F4E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.message,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


class _DismissBackground extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.only(right: 20),
      decoration: BoxDecoration(
        color: const Color(0xFFFF5252),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
          SizedBox(height: 4),
          Text('Eliminar',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}


class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF0A2E5C).withValues(alpha: 0.07),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_off_outlined,
              size: 36,
              color: Color(0xFF9EAFC2),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Sin notificaciones',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A2F4E),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Aquí aparecerán tus alertas\ny actualizaciones',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFF9EAFC2)),
          ),
        ],
      ),
    );
  }
}


class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFFF5252).withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.wifi_off_rounded,
                  size: 36, color: Color(0xFFFF5252)),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A2F4E),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0A2E5C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}



class _OrdenResumenSheet extends StatefulWidget {
  const _OrdenResumenSheet({
    required this.dato,
    required this.baseUrl,
    required this.onIrFormulario,
  });

  final Map<String, dynamic> dato;
  final String baseUrl;
  final Future<void> Function(dynamic orden) onIrFormulario;

  @override
  State<_OrdenResumenSheet> createState() => _OrdenResumenSheetState();
}

class _OrdenResumenSheetState extends State<_OrdenResumenSheet> {
  bool _loading = false;

  String _tipoLabel(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return 'Mantenimiento';
      case 'instalacion':   return 'Instalación';
      default:              return 'Inspección';
    }
  }

  Color _tipoColor(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return const Color(0xFF0EA5E9);
      case 'instalacion':   return const Color(0xFF8B5CF6);
      default:              return const Color(0xFFEF4444);
    }
  }

  IconData _tipoIcon(String tipo) {
    switch (tipo) {
      case 'mantenimiento': return Icons.build_outlined;
      case 'instalacion':   return Icons.electrical_services_outlined;
      default:              return Icons.search_outlined;
    }
  }

  Future<void> _irAlFormulario() async {
    setState(() => _loading = true);
    try {
      final idordenBackend = widget.dato['idorden'] as int;
      final tipo           = (widget.dato['strtipo']     as String?) ?? 'inspeccion';
      final contrato       = (widget.dato['strcontrato'] as String?) ?? '';
      final proyecto       = (widget.dato['strproyecto'] as String?) ?? '';
      final locacion       = (widget.dato['strlocacion'] as String?) ?? '';

      final idUsuario = await SessionRepository.instance.getIdUsuario();
      final personal  = widget.dato['personal'] as List<dynamic>? ?? [];
      final esLider   = personal.any(
        (p) => p['idusuario'] == idUsuario && (p['boolider'] as bool? ?? false),
      );

      final orden = await WorkOrderRepository.instance.findOrCreateByBackendId(
        idordenBackend: idordenBackend,
        title:       contrato.isNotEmpty ? contrato : 'Orden #$idordenBackend',
        description: proyecto.isNotEmpty ? proyecto : locacion,
        tipo:        tipo,
        esLider:     esLider,
        status:      'proceso',
      );

      if (!mounted) return;
      Navigator.pop(context);
      await widget.onIrFormulario(orden);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dato    = widget.dato;
    final tipo    = (dato['strtipo']     as String?) ?? 'inspeccion';
    final color   = _tipoColor(tipo);
    final personal = dato['personal'] as List<dynamic>? ?? [];

    Widget fila(IconData icon, String label, String? value) {
      if (value == null || value.isEmpty) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 15, color: const Color(0xFF9EAFC2)),
          const SizedBox(width: 10),
          SizedBox(width: 90,
            child: Text(label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF9EAFC2),
                  fontWeight: FontWeight.w500))),
          Expanded(child: Text(value,
            style: const TextStyle(fontSize: 12, color: Color(0xFF1A2F4E),
                fontWeight: FontWeight.w600))),
        ]),
      );
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.92,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(children: [
          const SizedBox(height: 12),
          Center(child: Container(width: 40, height: 4,
              decoration: BoxDecoration(color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),

          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  color.withValues(alpha: 0.12), color.withValues(alpha: 0.04)]),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.2)),
              ),
              child: Row(children: [
                Container(
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(_tipoIcon(tipo), color: color, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(_tipoLabel(tipo),
                        style: TextStyle(fontSize: 10,
                            fontWeight: FontWeight.w700, color: color)),
                    ),
                    const SizedBox(height: 4),
                    Text('Orden #${dato['idorden']}',
                      style: const TextStyle(fontSize: 15,
                          fontWeight: FontWeight.w800, color: Color(0xFF1A2F4E))),
                  ],
                )),
              ]),
            ),
          ),

          const SizedBox(height: 16),

          
          Expanded(
            child: ListView(controller: controller,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(children: [
                    fila(Icons.description_outlined, 'Contrato',  dato['strcontrato'] as String?),
                    fila(Icons.folder_outlined,       'Proyecto',  dato['strproyecto'] as String?),
                    fila(Icons.map_outlined,          'Locación',  dato['strlocacion'] as String?),
                    fila(Icons.water_drop_outlined,   'Pozo',      dato['strpozo']     as String?),
                    fila(Icons.tag_outlined,          'Registro',  dato['strregistro'] as String?),
                    fila(Icons.calendar_today_outlined,'Fecha',    dato['dtfecha']     as String?),
                  ]),
                ),

                if (personal.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  const Text('PERSONAL ASIGNADO',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                        color: Color(0xFF9EAFC2), letterSpacing: 0.8)),
                  const SizedBox(height: 8),
                  ...personal.map((p) {
                    final esLider = p['boolider'] as bool? ?? false;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF0A2E5C).withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person_outline_rounded,
                              size: 16, color: Color(0xFF0A2E5C)),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(p['nombre'] as String? ?? '',
                          style: const TextStyle(fontSize: 13,
                              color: Color(0xFF1A2F4E), fontWeight: FontWeight.w500))),
                        if (esLider)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0A2E5C).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Líder',
                              style: TextStyle(fontSize: 10,
                                  fontWeight: FontWeight.w700, color: Color(0xFF0A2E5C))),
                          ),
                      ]),
                    );
                  }),
                ],

                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _loading ? null : _irAlFormulario,
                    icon: _loading
                        ? const SizedBox(width: 18, height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.edit_note_rounded, size: 20),
                    label: Text(_loading ? 'Cargando…' : 'Ir al formulario',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0A2E5C),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),

                SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}
