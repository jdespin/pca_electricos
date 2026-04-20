import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../data/models/work_order.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/equipment_photo_repository.dart';
import '../../data/repositories/equipment_report_repository.dart';
import '../../data/repositories/order_report_repository.dart';
import '../../data/repositories/session_repository.dart';
import '../../data/repositories/work_order_repository.dart';

class _SyncSummary {
  final bool isOnline;
  final List<WorkOrder> proceso;
  final List<WorkOrder> finalizadas;
  final List<WorkOrder> evaluadas;

  const _SyncSummary({
    required this.isOnline,
    required this.proceso,
    required this.finalizadas,
    required this.evaluadas,
  });

  
  List<WorkOrder> get listoParaEnviar => finalizadas;

  bool get todoSincronizado =>
      finalizadas.isEmpty && proceso.isEmpty;
}

class SyncPage extends StatefulWidget {
  const SyncPage({super.key});

  @override
  State<SyncPage> createState() => _SyncPageState();
}

class _SyncPageState extends State<SyncPage>
    with SingleTickerProviderStateMixin {
  static final Uri _baseUri = Uri.parse(AuthRepository.baseUrl);
  static String get _backendHost => _baseUri.host;
  static int    get _backendPort => _baseUri.port;

  bool _syncing  = false;
  String _lastSync = 'Nunca';
  _SyncSummary? _summary;

  late final AnimationController _spinCtrl;

  @override
  void initState() {
    super.initState();
    _spinCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 1));
    _loadData();
  }

  @override
  void dispose() {
    _spinCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final results = await Future.wait([
      WorkOrderRepository.instance.listByStatus('proceso'),
      WorkOrderRepository.instance.listSyncable(),
      WorkOrderRepository.instance.listByStatus('evaluada'),
      _checkConnectivity(),
    ]);

    if (mounted) {
      setState(() {
        _summary = _SyncSummary(
          isOnline: results[3] as bool,
          proceso:     results[0] as List<WorkOrder>,
          finalizadas: results[1] as List<WorkOrder>,
          evaluadas:   results[2] as List<WorkOrder>,
        );
      });
    }
  }

  Future<bool> _checkConnectivity() async {
    try {
      final sock = await Socket.connect(_backendHost, _backendPort,
          timeout: const Duration(seconds: 4));
      sock.destroy();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _syncNow() async {
    if (_syncing) return;
    final summary = _summary;
    if (summary == null) return;

    if (!summary.isOnline) {
      _showSnack('Sin conexión al servidor',
          icon: Icons.wifi_off_rounded, color: const Color(0xFFE53935));
      return;
    }

    final idusuario = await SessionRepository.instance.getIdUsuario();
    if (idusuario == null) {
      _showSnack('Sesión no encontrada. Inicia sesión nuevamente.',
          icon: Icons.account_circle_outlined, color: const Color(0xFFE53935));
      return;
    }

    setState(() => _syncing = true);
    _spinCtrl.repeat();

    await _pullNuevasOrdenes(idusuario);
    await _pullEvaluaciones(idusuario);

    final syncables = await WorkOrderRepository.instance.listSyncable();
    final eligible = syncables
        .where((o) => o.id != null && o.idordenBackend != null)
        .toList();

    int enviadas = 0;
    int errores  = 0;
    for (final orden in eligible) {
      try {
        await _syncOrden(
          localId:        orden.id!,
          idordenBackend: orden.idordenBackend!,
          idusuario:      idusuario,
        );
        await WorkOrderRepository.instance.markSincronizado(orden.id!);
        enviadas++;
      } catch (_) {
        errores++;
      }
    }

    _spinCtrl.stop();
    _spinCtrl.reset();

    final now  = TimeOfDay.now();
    final hora = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    await _loadData();
    if (!mounted) return;
    setState(() {
      _syncing  = false;
      _lastSync = 'Hoy $hora';
    });

    if (errores == 0) {
      _showSnack(
        enviadas == 0 ? 'Todo sincronizado' : '$enviadas formulario(s) enviado(s)',
        icon: Icons.cloud_done_rounded,
        color: const Color(0xFF27AE7A),
      );
    } else {
      _showSnack('$enviadas enviado(s), $errores con error',
          icon: Icons.cloud_off_rounded, color: const Color(0xFFFF7043));
    }
  }

  Future<void> _pullNuevasOrdenes(int idusuario) async {
    try {
      final uri = Uri.parse(
        '${AuthRepository.baseUrl}/rutaorden/OrdenesUsuario/$idusuario/proceso',
      );
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));
      if (resp.statusCode != 200) return;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final lista = data['datos'] as List<dynamic>? ?? [];
      for (final item in lista) {
        final idorden    = item['idorden']         as int?;
        final tipo       = item['strtipo']         as String? ?? 'inspeccion';
        final contrato   = item['strcontratista']  as String? ?? '';
        final proyecto   = item['strsubcontratista'] as String? ?? '';
        final locacion   = item['strsitio']        as String? ?? '';
        final pozo       = item['strordencompra']  as String? ?? '';
        final esLider    = (item['boolider']       as bool?) ?? false;
        final supervisor = item['nombresupervisor'] as String?;
        if (idorden == null) continue;

        final title = 'Orden #$idorden${contrato.isNotEmpty ? ' - $contrato' : ''}';
        final descParts = [
          if (proyecto.isNotEmpty) 'Subcontratista: $proyecto',
          if (locacion.isNotEmpty) 'Sitio: $locacion',
          if (pozo.isNotEmpty) 'OC: $pozo',
        ];
        final description = descParts.isNotEmpty ? descParts.join(' | ') : 'Sin descripción';

        await WorkOrderRepository.instance.findOrCreateByBackendId(
          idordenBackend: idorden,
          title: title,
          description: description,
          tipo: tipo,
          esLider: esLider,
          status: 'proceso',
          supervisorNombre: supervisor,
        );
      }
    } catch (_) {}
  }

  Future<void> _pullEvaluaciones(int idusuario) async {
    try {
      final uri = Uri.parse(
        '${AuthRepository.baseUrl}/rutaorden/OrdenesEvaluadas/$idusuario',
      );
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));
      if (resp.statusCode != 200) return;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final lista = data['datos'] as List<dynamic>? ?? [];
      for (final item in lista) {
        final idorden = item['idorden'] as int?;
        final calificacion = item['strcalificacion'] as String?;
        final observacion = item['strobservacionevaluacion'] as String?;
        if (idorden == null || calificacion == null) continue;
        await WorkOrderRepository.instance.updateEvaluacion(
          idordenBackend: idorden,
          calificacion: calificacion,
          observacion: observacion,
        );
      }
    } catch (_) {}
  }

  Future<void> _syncOrden({
    required int localId,
    required int idordenBackend,
    required int idusuario,
  }) async {
    final rOrden   = await OrderReportRepository.instance.findByOrderId(localId);
    final rEquipos = await EquipmentReportRepository.instance.listByOrderId(localId);

    final fotosEquipoJson = <Map<String, dynamic>>[];
    for (final tipo in ['SUT', 'SDT', 'VSD', 'CHOKE', 'JB']) {
      final fotos = await EquipmentPhotoRepository.instance
          .listByOrderAndType(localId, tipo);
      for (final f in fotos) {
        final file = File(f.photoPath);
        if (!await file.exists()) continue;
        final bytes = await file.readAsBytes();
        fotosEquipoJson.add({
          'tipoequipo':  f.equipmentType,
          'etiqueta':    f.photoLabel,
          'obligatoria': f.isRequired,
          'base64':      base64Encode(bytes),
          'filename':    f.photoPath.split(Platform.pathSeparator).last,
          'mimetype':    'image/jpeg',
          'latitude':    f.latitude,
          'longitude':   f.longitude,
        });
      }
    }

    final body = jsonEncode({
      'idorden':   idordenBackend,
      'idusuario': idusuario,
      'reporteOrden': rOrden == null ? null : {
        'desviacionGeneral': rOrden.materiales,
        'conclusionGeneral': rOrden.observaciones,
        'terminado':         rOrden.trabajoRealizado,
      },
      'reportesEquipo': rEquipos.map((r) {
        final parts       = r.observaciones.split('\u001F');
        final estadoGeneral = parts.isNotEmpty ? parts[0] : '';
        final actividades   = parts.length >= 2 ? parts[1] : '';
        final desviaciones  = parts.length >= 3 ? parts[2] : '';
        return {
          'tipoequipo':    r.equipmentType,
          'potencia':      r.potencia,
          'serial':        r.serial,
          'marca':         r.marca,
          'caf':           r.caf,
          'estadoGeneral': estadoGeneral,
          'actividades':   actividades,
          'desviaciones':  desviaciones,
        };
      }).toList(),
      'fotosEquipo': fotosEquipoJson,
    });

    final uri = Uri.parse(
      '${AuthRepository.baseUrl}/rutareportetecnico/SincronizarReporte',
    );
    final resp = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: body,
    ).timeout(const Duration(seconds: 60));

    if (resp.statusCode != 200) throw Exception('HTTP ${resp.statusCode}');
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    if (data['success'] != true) throw Exception(data['mensaje'] ?? 'Error desconocido');
  }

  void _showSnack(String msg, {required IconData icon, required Color color}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        Icon(icon, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg)),
      ]),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 3),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final summary = _summary;
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF0A2E5C),
        child: CustomScrollView(
          slivers: [
            
            SliverToBoxAdapter(child: _Header(
              isOnline:     summary?.isOnline,
              lastSync:     _lastSync,
              syncing:      _syncing,
              spinCtrl:     _spinCtrl,
              listoCount:   summary?.listoParaEnviar.length ?? 0,
              onSync:       _syncNow,
              onRefresh:    _loadData,
            )),

            if (summary == null)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(
                    color: Color(0xFF0A2E5C), strokeWidth: 2)),
              )
            else ...[
              
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: _StatusRow(summary: summary),
              )),

              
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: _SectionHeader(
                  title: 'Listos para enviar',
                  count: summary.listoParaEnviar.length,
                  color: const Color(0xFF27AE7A),
                ),
              )),

              if (summary.listoParaEnviar.isEmpty)
                SliverToBoxAdapter(child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  child: _EmptyState(
                    icon: Icons.cloud_done_rounded,
                    title: 'Todo sincronizado',
                    subtitle: 'No hay formularios pendientes de envío.',
                    color: const Color(0xFF27AE7A),
                  ),
                ))
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final o = summary.listoParaEnviar[i];
                      return Padding(
                        padding: EdgeInsets.fromLTRB(16, 0, 16,
                            i == summary.listoParaEnviar.length - 1 ? 0 : 10),
                        child: _OrderCard(order: o, variant: _CardVariant.listo),
                      );
                    },
                    childCount: summary.listoParaEnviar.length,
                  ),
                ),

              
              if (summary.proceso.isNotEmpty) ...[
                SliverToBoxAdapter(child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: _SectionHeader(
                    title: 'En proceso',
                    count: summary.proceso.length,
                    color: const Color(0xFF4A90D9),
                    subtitle: 'El técnico aún no ha completado el formulario',
                  ),
                )),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final o = summary.proceso[i];
                      return Padding(
                        padding: EdgeInsets.fromLTRB(16, 0, 16,
                            i == summary.proceso.length - 1 ? 0 : 10),
                        child: _OrderCard(order: o, variant: _CardVariant.proceso),
                      );
                    },
                    childCount: summary.proceso.length,
                  ),
                ),
              ],

              
              if (summary.evaluadas.isNotEmpty) ...[
                SliverToBoxAdapter(child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: _SectionHeader(
                    title: 'Ya enviados',
                    count: summary.evaluadas.length,
                    color: const Color(0xFF8B6FD4),
                  ),
                )),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final o = summary.evaluadas[i];
                      return Padding(
                        padding: EdgeInsets.fromLTRB(16, 0, 16,
                            i == summary.evaluadas.length - 1 ? 0 : 10),
                        child: _OrderCard(order: o, variant: _CardVariant.enviado),
                      );
                    },
                    childCount: summary.evaluadas.length,
                  ),
                ),
              ],

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.isOnline,
    required this.lastSync,
    required this.syncing,
    required this.spinCtrl,
    required this.listoCount,
    required this.onSync,
    required this.onRefresh,
  });

  final bool? isOnline;
  final String lastSync;
  final bool syncing;
  final AnimationController spinCtrl;
  final int listoCount;
  final VoidCallback onSync;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final online      = isOnline;
    final connected   = online == true;
    final checking    = online == null;
    final statusColor = checking
        ? Colors.white54
        : connected ? const Color(0xFF4ADE80) : const Color(0xFFFF7043);
    final statusText  = checking
        ? 'Verificando conexión...'
        : connected ? 'Servidor disponible' : 'Sin conexión al servidor';

    return Container(
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
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              Row(children: [
                const Icon(Icons.cloud_sync_rounded, color: Colors.white, size: 24),
                const SizedBox(width: 10),
                const Text('Sincronización',
                    style: TextStyle(color: Colors.white, fontSize: 20,
                        fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(
                  onPressed: onRefresh,
                  tooltip: 'Actualizar',
                  icon: Icon(Icons.refresh_rounded,
                      color: Colors.white.withValues(alpha: 0.7)),
                ),
              ]),

              const SizedBox(height: 16),

              
              Row(children: [
                Container(
                  width: 8, height: 8,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                    boxShadow: connected ? [
                      BoxShadow(color: statusColor.withValues(alpha: 0.6),
                          blurRadius: 6, spreadRadius: 1)
                    ] : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(statusText,
                      style: TextStyle(color: statusColor,
                          fontSize: 13, fontWeight: FontWeight.w600)),
                ),
                Text('Última: $lastSync',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 11)),
              ]),

              const SizedBox(height: 16),

              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: syncing ? null : onSync,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0A2E5C),
                    disabledBackgroundColor: Colors.white.withValues(alpha: 0.35),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (syncing)
                        RotationTransition(
                          turns: spinCtrl,
                          child: const Icon(Icons.sync_rounded, size: 20),
                        )
                      else
                        const Icon(Icons.cloud_upload_outlined, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        syncing
                            ? 'Enviando datos...'
                            : listoCount > 0
                                ? 'Sincronizar ($listoCount pendiente${listoCount > 1 ? 's' : ''})'
                                : 'Sincronizar',
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ],
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

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.summary});
  final _SyncSummary summary;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _StatusChip(
        label: 'Pendientes',
        value: '${summary.listoParaEnviar.length}',
        color: summary.listoParaEnviar.isEmpty
            ? const Color(0xFF27AE7A)
            : const Color(0xFFF59E0B),
        icon: summary.listoParaEnviar.isEmpty
            ? Icons.check_circle_outline_rounded
            : Icons.upload_outlined,
      ),
      const SizedBox(width: 10),
      _StatusChip(
        label: 'En proceso',
        value: '${summary.proceso.length}',
        color: const Color(0xFF4A90D9),
        icon: Icons.autorenew_rounded,
      ),
      const SizedBox(width: 10),
      _StatusChip(
        label: 'Enviados',
        value: '${summary.evaluadas.length}',
        color: const Color(0xFF8B6FD4),
        icon: Icons.cloud_done_rounded,
      ),
    ]);
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });
  final String label, value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(value,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                    color: color)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(fontSize: 11, color: Color(0xFF9EAFC2),
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.color,
    this.subtitle,
  });
  final String title;
  final int count;
  final Color color;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Text(title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                  color: Color(0xFF1A2F4E))),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text('$count',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                    color: color)),
          ),
        ]),
        if (subtitle != null) ...[
          const SizedBox(height: 3),
          Text(subtitle!,
              style: const TextStyle(fontSize: 11, color: Color(0xFF9EAFC2))),
        ],
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });
  final IconData icon;
  final String title, subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2F4E))),
            const SizedBox(height: 3),
            Text(subtitle,
                style: const TextStyle(fontSize: 12, color: Color(0xFF9EAFC2))),
          ],
        )),
      ]),
    );
  }
}

enum _CardVariant { listo, proceso, enviado }

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.variant});
  final WorkOrder order;
  final _CardVariant variant;

  static const _tipoLabels = {
    'inspeccion': 'Inspección',
    'mantenimiento': 'Mantenimiento',
    'instalacion': 'Instalación',
  };

  @override
  Widget build(BuildContext context) {
    final Color accentColor;
    final IconData accentIcon;
    final String statusLabel;

    switch (variant) {
      case _CardVariant.listo:
        accentColor = const Color(0xFF27AE7A);
        accentIcon  = Icons.upload_outlined;
        statusLabel = 'Listo para enviar';
        break;
      case _CardVariant.proceso:
        accentColor = const Color(0xFF4A90D9);
        accentIcon  = Icons.edit_outlined;
        statusLabel = 'En proceso';
        break;
      case _CardVariant.enviado:
        accentColor = const Color(0xFF8B6FD4);
        accentIcon  = Icons.cloud_done_rounded;
        statusLabel = 'Enviado';
        break;
    }

    final fecha = DateTime.fromMillisecondsSinceEpoch(order.updatedAt);
    final fechaStr =
        '${fecha.day.toString().padLeft(2, '0')}/${fecha.month.toString().padLeft(2, '0')}/${fecha.year}';
    final tipoLabel = _tipoLabels[order.tipo] ?? order.tipo;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          Container(
            width: 4,
            height: 80,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(accentIcon, color: accentColor, size: 20),
            ),
          ),
          
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 14, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                      child: Text(order.title,
                          style: const TextStyle(fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A2F4E)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Text(fechaStr,
                        style: const TextStyle(fontSize: 11,
                            color: Color(0xFF9EAFC2))),
                  ]),
                  const SizedBox(height: 4),
                  Text(order.description,
                      style: const TextStyle(fontSize: 12,
                          color: Color(0xFF6B7280)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Row(children: [
                    _Chip(label: tipoLabel,  color: const Color(0xFF8B6FD4)),
                    const SizedBox(width: 6),
                    _Chip(label: statusLabel, color: accentColor),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
              color: color)),
    );
  }
}
