import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../data/models/work_order.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/session_repository.dart';
import '../../data/repositories/work_order_repository.dart';
import '../../data/repositories/equipment_report_repository.dart';
import 'orden_equipos_form_page.dart';

String _parseCampo(String description, String campo) {
  for (final part in description.split('|')) {
    final t = part.trim();
    if (t.startsWith('$campo: ')) return t.substring(campo.length + 2).trim();
  }
  return '—';
}

String _parseContratista(String title) {
  final idx = title.indexOf(' - ');
  return idx >= 0 ? title.substring(idx + 3).trim() : '—';
}



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



String _statusTitulo(String status) {
  switch (status) {
    case 'proceso':    return 'En Proceso';
    case 'finalizada': return 'Finalizadas';
    case 'evaluada':   return 'Evaluadas';
    default:           return 'Órdenes';
  }
}

Color _statusColor(String status) {
  switch (status) {
    case 'proceso':    return const Color(0xFFF59E0B);
    case 'finalizada': return const Color(0xFF10B981);
    case 'evaluada':   return const Color(0xFF6366F1);
    default:           return const Color(0xFF4A90D9);
  }
}

IconData _statusIcon(String status) {
  switch (status) {
    case 'proceso':    return Icons.autorenew_rounded;
    case 'finalizada': return Icons.check_circle_outline_rounded;
    case 'evaluada':   return Icons.assignment_turned_in_outlined;
    default:           return Icons.list_alt_rounded;
  }
}

String _statusSubtitulo(String status) {
  switch (status) {
    case 'proceso':    return 'Órdenes activas en ejecución';
    case 'finalizada': return 'Órdenes completadas';
    case 'evaluada':   return 'Órdenes revisadas y evaluadas';
    default:           return '';
  }
}



class OrdenesListPage extends StatefulWidget {
  const OrdenesListPage({super.key, required this.status});

  final String status;

  @override
  State<OrdenesListPage> createState() => _OrdenesListPageState();
}

class _OrdenesListPageState extends State<OrdenesListPage>
    with WidgetsBindingObserver {
  List<WorkOrder> _ordenes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (widget.status == 'evaluada' || widget.status == 'proceso') {
      _pullAndLoad();
    } else {
      _loadOrdenes();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        (widget.status == 'evaluada' || widget.status == 'proceso')) {
      _pullAndLoad();
    }
  }

  Future<void> _pullAndLoad() async {
    try {
      final idusuario = await SessionRepository.instance.getIdUsuario();
      if (idusuario != null) {
        if (widget.status == 'evaluada') {
          final uri = Uri.parse(
            '${AuthRepository.baseUrl}/rutaorden/OrdenesEvaluadas/$idusuario',
          );
          final resp = await http.get(uri).timeout(const Duration(seconds: 10));
          if (resp.statusCode == 200) {
            final data = jsonDecode(resp.body) as Map<String, dynamic>;
            final lista = data['datos'] as List<dynamic>? ?? [];
            for (final item in lista) {
              final idorden      = item['idorden'] as int?;
              final calificacion = item['strcalificacion'] as String?;
              final observacion  = item['strobservacionevaluacion'] as String?;
              if (idorden == null || calificacion == null) continue;
              await WorkOrderRepository.instance.updateEvaluacion(
                idordenBackend: idorden,
                calificacion: calificacion,
                observacion: observacion,
              );
            }
          }
        } else if (widget.status == 'proceso') {
          final uri = Uri.parse(
            '${AuthRepository.baseUrl}/rutaorden/OrdenesUsuario/$idusuario/proceso',
          );
          final resp = await http.get(uri).timeout(const Duration(seconds: 10));
          if (resp.statusCode == 200) {
            final data = jsonDecode(resp.body) as Map<String, dynamic>;
            final lista = data['datos'] as List<dynamic>? ?? [];
            for (final item in lista) {
              final idorden  = item['idorden']    as int?;
              final tipo     = item['strtipo']    as String? ?? 'inspeccion';
              final contrato = item['strcontratista'] as String? ?? '';
              final proyecto = item['strsubcontratista'] as String? ?? '';
              final locacion = item['strsitio'] as String? ?? '';
              final pozo     = item['strordencompra'] as String? ?? '';
              final esLider    = (item['boolider']       as bool?) ?? false;
              final supervisor = item['nombresupervisor'] as String?;
              if (idorden == null) continue;
              final title = 'Orden #$idorden${contrato.isNotEmpty ? ' - $contrato' : ''}';
              final descParts = [
                if (proyecto.isNotEmpty) 'Subcontratista: $proyecto',
                if (locacion.isNotEmpty) 'Sitio: $locacion',
                if (pozo.isNotEmpty) 'OC: $pozo',
              ];
              await WorkOrderRepository.instance.findOrCreateByBackendId(
                idordenBackend: idorden,
                title: title,
                description: descParts.isNotEmpty ? descParts.join(' | ') : 'Sin descripción',
                tipo: tipo,
                esLider: esLider,
                status: 'proceso',
                supervisorNombre: supervisor,
              );
            }
          }
        }
      }
    } catch (_) {}
    if (mounted) _loadOrdenes();
  }

  Future<void> _loadOrdenes() async {
    setState(() => _loading = true);
    final ordenes =
        await WorkOrderRepository.instance.listByStatus(widget.status);
    if (mounted) setState(() { _ordenes = ordenes; _loading = false; });
  }

  String _formatFecha(int epochMs) {
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs);
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')}/'
        '${dt.year}';
  }

  String _formatFechaHora(int epochMs) {
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs);
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')}/'
        '${dt.year}  '
        '${dt.hour.toString().padLeft(2, '0')}:'
        '${dt.minute.toString().padLeft(2, '0')}';
  }

  void _mostrarDetalle(WorkOrder orden) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DetalleOrdenSheet(
        orden: orden,
        status: widget.status,
        formatFechaHora: _formatFechaHora,
        onCargar: (orden.esLider && widget.status != 'evaluada')
            ? () {
                Navigator.pop(context);
                if (widget.status == 'proceso') {
                  _mostrarSeleccionEquipos(orden);
                } else {
                  _verFormularioFinalizado(orden);
                }
              }
            : null,
      ),
    );
  }

  Future<void> _verFormularioFinalizado(WorkOrder orden) async {
    final savedReports = await EquipmentReportRepository.instance
        .listByOrderId(orden.id!);
    final equipos = savedReports.map((r) => r.equipmentType).toList();
    if (!mounted) return;
    if (equipos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Row(children: [
          Icon(Icons.info_outline, color: Colors.white, size: 18),
          SizedBox(width: 8),
          Text('No hay formulario guardado para esta orden'),
        ]),
        backgroundColor: const Color(0xFF6B7280),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ));
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OrdenEquiposFormPage(
          orden: orden,
          equipos: equipos,
          readOnly: true,
        ),
      ),
    ).then((_) => _loadOrdenes());
  }

  Future<void> _mostrarSeleccionEquipos(WorkOrder orden) async {
    
    final savedReports = await EquipmentReportRepository.instance
        .listByOrderId(orden.id!);
    final preselected =
        savedReports.map((r) => r.equipmentType).toList();

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
              builder: (_) => OrdenEquiposFormPage(
                orden: orden,
                equipos: equipos,
              ),
            ),
          ).then((_) => _loadOrdenes());
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(widget.status);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: Column(
        children: [
          
          _ListHeader(
            status: widget.status,
            count: _loading ? null : _ordenes.length,
          ),

          
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(
                        color: color, strokeWidth: 2.5))
                : _ordenes.isEmpty
                    ? _EmptyState(status: widget.status)
                    : RefreshIndicator(
                        color: color,
                        onRefresh: (widget.status == 'proceso' || widget.status == 'evaluada')
                            ? _pullAndLoad
                            : _loadOrdenes,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                          itemCount: _ordenes.length,
                          itemBuilder: (context, i) => _OrdenCard(
                            orden: _ordenes[i],
                            status: widget.status,
                            fecha: _formatFecha(_ordenes[i].createdAt),
                            onTap: () => _mostrarDetalle(_ordenes[i]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}



class _ListHeader extends StatelessWidget {
  const _ListHeader({required this.status, required this.count});

  final String status;
  final int? count;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    final icon  = _statusIcon(status);

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
          padding: const EdgeInsets.fromLTRB(8, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: Colors.white, size: 20),
                  ),
                  const Spacer(),
                  if (count != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: color.withValues(alpha: 0.5)),
                      ),
                      child: Text(
                        '$count ${count == 1 ? 'orden' : 'órdenes'}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 4),

              
              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: color.withValues(alpha: 0.4)),
                      ),
                      child: Icon(icon, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Órdenes',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          _statusTitulo(status),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Text(
                  _statusSubtitulo(status),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}



Color _calificacionColor(String? c) {
  switch (c) {
    case 'A': return const Color(0xFF10B981);
    case 'B': return const Color(0xFFF59E0B);
    case 'C': return const Color(0xFFEF4444);
    default:  return const Color(0xFF9CA3AF);
  }
}

class _OrdenCard extends StatelessWidget {
  const _OrdenCard({
    required this.orden,
    required this.status,
    required this.fecha,
    required this.onTap,
  });

  final WorkOrder orden;
  final String status;
  final String fecha;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final sColor = _statusColor(status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Row(
            children: [
              
              Container(
                width: 4,
                height: 90,
                decoration: BoxDecoration(
                  color: sColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    bottomLeft: Radius.circular(16),
                  ),
                ),
              ),

              const SizedBox(width: 14),

              
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _tipoColor(orden.tipo).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(_tipoIcon(orden.tipo),
                    color: _tipoColor(orden.tipo), size: 20),
              ),

              const SizedBox(width: 12),


              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: status == 'proceso'
                      ? _CardContentProceso(orden: orden, fecha: fecha, sColor: sColor)
                      : _CardContentDefault(orden: orden, status: status, fecha: fecha, sColor: sColor),
                ),
              ),

              const Padding(
                padding: EdgeInsets.only(right: 12),
                child: Icon(Icons.chevron_right_rounded,
                    color: Color(0xFFCDD5DF), size: 22),
              ),
            ],
          ),
        ),
      ),
    );
  }
}



class _CardContentProceso extends StatelessWidget {
  const _CardContentProceso({required this.orden, required this.fecha, required this.sColor});
  final WorkOrder orden;
  final String fecha;
  final Color sColor;

  @override
  Widget build(BuildContext context) {
    final sitio = _parseCampo(orden.description, 'Sitio');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                sitio,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1A2F4E)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            _TipoBadge(tipo: orden.tipo),
          ],
        ),
        if (orden.supervisorNombre != null && orden.supervisorNombre!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Row(children: [
            const Icon(Icons.person_outline_rounded, size: 11, color: Color(0xFF6366F1)),
            const SizedBox(width: 3),
            Expanded(
              child: Text(orden.supervisorNombre!, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: Color(0xFF6366F1), fontWeight: FontWeight.w600)),
            ),
          ]),
        ],
        const SizedBox(height: 6),
        Row(children: [
          Icon(Icons.calendar_today_outlined, size: 11, color: sColor.withValues(alpha: 0.7)),
          const SizedBox(width: 4),
          Text(fecha, style: TextStyle(fontSize: 11, color: sColor.withValues(alpha: 0.8), fontWeight: FontWeight.w600)),
          const Spacer(),
          if (orden.idordenBackend != null)
            Text('#${orden.idordenBackend}', style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
        ]),
      ],
    );
  }
}

class _CardContentDefault extends StatelessWidget {
  const _CardContentDefault({required this.orden, required this.status, required this.fecha, required this.sColor});
  final WorkOrder orden;
  final String status;
  final String fecha;
  final Color sColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Expanded(
            child: Text(orden.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1A2F4E)),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          const SizedBox(width: 8),
          _TipoBadge(tipo: orden.tipo),
        ]),
        const SizedBox(height: 4),
        Text(orden.description, maxLines: 1, overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        if (orden.supervisorNombre != null && orden.supervisorNombre!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Row(children: [
            const Icon(Icons.person_outline_rounded, size: 11, color: Color(0xFF6366F1)),
            const SizedBox(width: 3),
            Expanded(
              child: Text(orden.supervisorNombre!, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: Color(0xFF6366F1), fontWeight: FontWeight.w600)),
            ),
          ]),
        ],
        const SizedBox(height: 6),
        Row(children: [
          Icon(Icons.calendar_today_outlined, size: 11, color: sColor.withValues(alpha: 0.7)),
          const SizedBox(width: 4),
          Text(fecha, style: TextStyle(fontSize: 11, color: sColor.withValues(alpha: 0.8), fontWeight: FontWeight.w600)),
          const Spacer(),
          if (status == 'evaluada' && orden.calificacion != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: _calificacionColor(orden.calificacion).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: _calificacionColor(orden.calificacion).withValues(alpha: 0.4)),
              ),
              child: Text(orden.calificacion!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: _calificacionColor(orden.calificacion))),
            )
          else
            Text('#${orden.id ?? '-'}', style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
        ]),
      ],
    );
  }
}

class _DetalleOrdenSheet extends StatefulWidget {
  const _DetalleOrdenSheet({
    required this.orden,
    required this.status,
    required this.formatFechaHora,
    required this.onCargar,
  });

  final WorkOrder orden;
  final String status;
  final String Function(int) formatFechaHora;
  final VoidCallback? onCargar;

  @override
  State<_DetalleOrdenSheet> createState() => _DetalleOrdenSheetState();
}

class _DetalleOrdenSheetState extends State<_DetalleOrdenSheet> {
  List<Map<String, dynamic>> _personal = [];
  bool _loadingPersonal = false;

  @override
  void initState() {
    super.initState();
    if (widget.orden.idordenBackend != null) _fetchPersonal();
  }

  Future<void> _fetchPersonal() async {
    setState(() => _loadingPersonal = true);
    try {
      final uri = Uri.parse(
        '${AuthRepository.baseUrl}/rutaorden/DetalleOrden/${widget.orden.idordenBackend}',
      );
      final resp = await http.get(uri).timeout(const Duration(seconds: 8));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final personal = (data['dato']?['personal'] as List<dynamic>?) ?? [];
          if (mounted) setState(() => _personal = personal.cast<Map<String, dynamic>>());
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingPersonal = false);
  }

  @override
  Widget build(BuildContext context) {
    final orden   = widget.orden;
    final status  = widget.status;
    final sIcon   = _statusIcon(status);
    final sTitulo = _statusTitulo(status);

    final contratista    = _parseContratista(orden.title);
    final subcontratista = _parseCampo(orden.description, 'Subcontratista');
    final sitio          = _parseCampo(orden.description, 'Sitio');
    final ordenCompra    = _parseCampo(orden.description, 'OC');

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0A2E5C), Color(0xFF1A5FA8)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(sIcon, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(sTitulo,
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                            ),
                            const SizedBox(width: 8),
                            _TipoBadge(tipo: orden.tipo),
                          ]),
                          const SizedBox(height: 6),
                          Text(
                            sitio != '—' ? sitio : orden.title,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                          ),
                          if (orden.idordenBackend != null)
                            Text('Orden #${orden.idordenBackend}',
                              style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.6))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [

                  _SheetSection(
                    icon: Icons.business_outlined,
                    label: 'Datos generales',
                    child: Column(
                      children: [
                        _DetalleRow(label: 'Contratista',    value: contratista),
                        const SizedBox(height: 6),
                        _DetalleRow(label: 'Subcontratista', value: subcontratista),
                        const SizedBox(height: 6),
                        _DetalleRow(label: 'Sitio',          value: sitio),
                        const SizedBox(height: 6),
                        _DetalleRow(label: 'Orden de compra', value: ordenCompra),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  _SheetSection(
                    icon: Icons.supervisor_account_outlined,
                    label: 'Supervisor creador',
                    child: Row(
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0A2E5C), Color(0xFF1A5FA8)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            (orden.supervisorNombre?.isNotEmpty == true ? orden.supervisorNombre![0] : '?').toUpperCase(),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            orden.supervisorNombre?.isNotEmpty == true ? orden.supervisorNombre! : '—',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1A2F4E)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  _SheetSection(
                    icon: Icons.group_outlined,
                    label: 'Personal asignado',
                    child: _loadingPersonal
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Center(child: SizedBox(width: 20, height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0A2E5C)))),
                          )
                        : _personal.isEmpty
                            ? const Text('Sin personal registrado.', style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)))
                            : Column(
                                children: _personal.map((p) {
                                  final nombre = p['nombre'] as String? ?? '—';
                                  final esLider = p['boolider'] as bool? ?? false;
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: esLider ? const Color(0xFF0A2E5C).withValues(alpha: 0.06) : const Color(0xFFF9FAFB),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: esLider ? const Color(0xFF0A2E5C).withValues(alpha: 0.2) : const Color(0xFFE5E7EB),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 36, height: 36,
                                            decoration: BoxDecoration(
                                              color: esLider ? const Color(0xFF0A2E5C) : const Color(0xFF9CA3AF).withValues(alpha: 0.2),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              nombre.isNotEmpty ? nombre[0].toUpperCase() : '?',
                                              style: TextStyle(
                                                fontSize: 14, fontWeight: FontWeight.w800,
                                                color: esLider ? Colors.white : const Color(0xFF6B7280),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Text(nombre,
                                              style: TextStyle(
                                                fontSize: 13, fontWeight: FontWeight.w600,
                                                color: esLider ? const Color(0xFF0A2E5C) : const Color(0xFF374151),
                                              )),
                                          ),
                                          if (esLider)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF0A2E5C),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: const Text('Líder',
                                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                                            ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                  ),

                  if (status == 'evaluada' && (orden.calificacion != null || orden.observacion != null)) ...[
                    const SizedBox(height: 12),
                    _SheetSection(
                      icon: Icons.star_outline_rounded,
                      label: 'Evaluación del supervisor',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (orden.calificacion != null)
                            Row(children: [
                              Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  color: _calificacionColor(orden.calificacion).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: _calificacionColor(orden.calificacion).withValues(alpha: 0.4)),
                                ),
                                alignment: Alignment.center,
                                child: Text(orden.calificacion!,
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: _calificacionColor(orden.calificacion))),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                orden.calificacion == 'A' ? 'Excelente' : orden.calificacion == 'B' ? 'Bueno' : 'Regular',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _calificacionColor(orden.calificacion)),
                              ),
                            ]),
                          if (orden.observacion != null && orden.observacion!.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(orden.observacion!,
                                style: const TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.5)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  if (widget.onCargar != null)
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton.icon(
                        onPressed: widget.onCargar,
                        icon: Icon(status == 'proceso' ? Icons.assignment_outlined : Icons.visibility_outlined),
                        label: Text(
                          status == 'proceso' ? 'Abrir reporte' : 'Ver reporte',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0A2E5C),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      height: 54,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.lock_outline_rounded, size: 18, color: Color(0xFF9CA3AF)),
                          SizedBox(width: 8),
                          Text('Solo el líder puede abrir esta orden',
                            style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),

                  SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SheetSection extends StatelessWidget {
  const _SheetSection({
    required this.icon,
    required this.label,
    required this.child,
  });

  final IconData icon;
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: const Color(0xFF9CA3AF)),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF9CA3AF),
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _DetalleRow extends StatelessWidget {
  const _DetalleRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF9CA3AF))),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1A2F4E))),
        ),
      ],
    );
  }
}



class _TipoBadge extends StatelessWidget {
  const _TipoBadge({required this.tipo});
  final String tipo;

  @override
  Widget build(BuildContext context) {
    final color = _tipoColor(tipo);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_tipoIcon(tipo), size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            _tipoLabel(tipo),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}



class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    final icon  = _statusIcon(status);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 44, color: color.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 20),
            Text(
              'Sin órdenes ${_statusTitulo(status).toLowerCase()}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A2F4E),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No hay órdenes en esta\ncategoría por el momento.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: const Color(0xFF1A2F4E).withValues(alpha: 0.4),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
