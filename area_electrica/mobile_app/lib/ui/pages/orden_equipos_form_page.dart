import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:geolocator/geolocator.dart';

import '../../data/models/work_order.dart';
import '../../data/models/order_report.dart';
import '../../data/models/equipment_report.dart';
import '../../data/models/equipment_photo.dart';
import '../../data/repositories/order_report_repository.dart';
import '../../data/repositories/equipment_report_repository.dart';
import '../../data/repositories/equipment_photo_repository.dart';
import '../../data/repositories/work_order_repository.dart';

class _EquipConfig {
  final String name;
  final String fullName;
  final bool hasDatosGenerales;
  final List<String> requiredPhotoLabels;
  final int maxExtraPhotos;
  final Color color;
  final IconData icon;

  const _EquipConfig({
    required this.name,
    required this.fullName,
    required this.hasDatosGenerales,
    required this.requiredPhotoLabels,
    required this.maxExtraPhotos,
    required this.color,
    required this.icon,
  });
}

const Map<String, _EquipConfig> _equipConfigs = {
  'SUT': _EquipConfig(
    name: 'SUT',
    fullName: 'Surface Unit Transformer',
    hasDatosGenerales: true,
    requiredPhotoLabels: ['Frontal', 'Posterior', 'Placas', 'Mirillas'],
    maxExtraPhotos: 5,
    color: Color(0xFF0EA5E9),
    icon: Icons.electrical_services_outlined,
  ),
  'SDT': _EquipConfig(
    name: 'SDT',
    fullName: 'Step Down Transformer',
    hasDatosGenerales: true,
    requiredPhotoLabels: ['Frontal', 'Posterior', 'Placas', 'Mirillas'],
    maxExtraPhotos: 5,
    color: Color(0xFF8B5CF6),
    icon: Icons.transform_outlined,
  ),
  'VSD': _EquipConfig(
    name: 'VSD',
    fullName: 'Variable Speed Drive',
    hasDatosGenerales: true,
    requiredPhotoLabels: ['Frontal', 'Posterior', 'Placas', 'Ventiladores'],
    maxExtraPhotos: 5,
    color: Color(0xFF10B981),
    icon: Icons.speed_outlined,
  ),
  'CHOKE': _EquipConfig(
    name: 'CHOKE',
    fullName: 'Choke / Reactancia',
    hasDatosGenerales: false,
    requiredPhotoLabels: ['Frontal', 'Abierto', 'Placa'],
    maxExtraPhotos: 3,
    color: Color(0xFFF59E0B),
    icon: Icons.bolt_outlined,
  ),
  'JB': _EquipConfig(
    name: 'JB',
    fullName: 'Junction Box',
    hasDatosGenerales: false,
    requiredPhotoLabels: ['Frontal', 'Abierto', 'Placa'],
    maxExtraPhotos: 3,
    color: Color(0xFFEF4444),
    icon: Icons.cable_outlined,
  ),
};

const List<String> _allEquipTypes = ['SUT', 'SDT', 'VSD', 'CHOKE', 'JB'];

const Map<String, List<String>> _predefinedActividades = {
  'SDT': [
    'Limpieza interna y externa',
    'Verificación de puntos de conexión',
    'Revisión de componentes internos',
    'Medición de lazos del sistema de puesta a tierra',
  ],
  'VSD': [
    'Limpieza interna y externa',
    'Verificación de puntos de conexión',
    'Revisión de componentes internos',
    'Limpieza del sistema de enfriamiento del VSD',
    'Medición de lazos del sistema de puesta a tierra',
  ],
  'SUT': [
    'Limpieza interna y externa',
    'Verificación de puntos de conexión',
    'Revisión de componentes internos',
    'Medición de lazos del sistema de puesta a tierra',
  ],
  'CHOKE': [
    'Limpieza externa e interna',
    'Medición de lazos del sistema de puesta a tierra',
  ],
  'JB': [
    'Limpieza externa e interna',
    'Medición de lazos del sistema de puesta a tierra',
  ],
};

const List<String> _estadosEquipo = ['Bueno', 'Regular', 'Deficiente'];

Future<Position?> _obtenerUbicacion() async {
  bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) return null;
  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return null;
  }
  if (permission == LocationPermission.deniedForever) return null;
  try {
    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 12),
      ),
    );
  } catch (_) {}
  try {
    return await Geolocator.getLastKnownPosition();
  } catch (_) {
    return null;
  }
}

class EquiposSelectionSheet extends StatefulWidget {
  const EquiposSelectionSheet({
    super.key,
    required this.orden,
    required this.onConfirm,
    this.preselected = const [],
  });

  final WorkOrder orden;
  final List<String> preselected;
  final void Function(List<String> equipos) onConfirm;

  @override
  State<EquiposSelectionSheet> createState() => _EquiposSelectionSheetState();
}

class _EquiposSelectionSheetState extends State<EquiposSelectionSheet> {
  late Set<String> _selected;

  @override
  void initState() {
    super.initState();
    _selected = Set.from(widget.preselected);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Seleccionar equipos',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1A2F4E)),
              ),
              const SizedBox(height: 4),
              const Text(
                '¿A qué equipos se les realizará el trabajo?',
                style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 20),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.6,
                children: _allEquipTypes.map((type) {
                  final cfg    = _equipConfigs[type]!;
                  final active = _selected.contains(type);
                  return GestureDetector(
                    onTap: () => setState(() {
                      if (active) _selected.remove(type); else _selected.add(type);
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color: active ? cfg.color.withValues(alpha: 0.12) : const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: active ? cfg.color : const Color(0xFFE5E7EB),
                          width: active ? 1.8 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(cfg.icon, color: active ? cfg.color : const Color(0xFF9EAFC2), size: 22),
                          const SizedBox(height: 4),
                          Text(
                            cfg.name,
                            style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w700,
                              color: active ? cfg.color : const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity, height: 50,
                child: ElevatedButton(
                  onPressed: _selected.isEmpty ? null : () => widget.onConfirm(_selected.toList()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A2E5C),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF0A2E5C).withValues(alpha: 0.3),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Text(
                    _selected.isEmpty
                        ? 'Selecciona al menos un equipo'
                        : 'Continuar con ${_selected.length} equipo${_selected.length != 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
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

const _kSep = '\u001F'; 

class _EquipState {
  final TextEditingController potencia;
  final TextEditingController serial;
  final TextEditingController marca;
  final TextEditingController caf;
  final TextEditingController actividadesLibres;  
  final TextEditingController desviaciones;       
  final Set<String> selectedActividades;
  final Map<String, EquipmentPhoto?> requiredPhotos;
  final List<EquipmentPhoto> extraPhotos;
  String estadoGeneral = ''; 
  String? capturingLabel;
  bool isCapturing = false;

  _EquipState({required List<String> requiredLabels})
      : potencia          = TextEditingController(),
        serial            = TextEditingController(),
        marca             = TextEditingController(),
        caf               = TextEditingController(),
        actividadesLibres = TextEditingController(),
        desviaciones      = TextEditingController(),
        selectedActividades = {},
        requiredPhotos    = {for (final l in requiredLabels) l: null},
        extraPhotos       = [];

  void dispose() {
    potencia.dispose();
    serial.dispose();
    marca.dispose();
    caf.dispose();
    actividadesLibres.dispose();
    desviaciones.dispose();
  }

  
  String encodeObservaciones() {
    final actPart = [...selectedActividades, actividadesLibres.text.trim()]
        .where((s) => s.isNotEmpty)
        .join('\n');
    return [estadoGeneral, actPart, desviaciones.text.trim()].join(_kSep);
  }

  
  void decodeObservaciones(String raw, List<String> predefined) {
    final parts = raw.split(_kSep);
    estadoGeneral = parts.isNotEmpty ? parts[0] : '';
    if (parts.length >= 2) {
      final lines = parts[1].split('\n').where((l) => l.isNotEmpty).toList();
      final freeLines = <String>[];
      for (final l in lines) {
        if (predefined.contains(l)) {
          selectedActividades.add(l);
        } else {
          freeLines.add(l);
        }
      }
      actividadesLibres.text = freeLines.join('\n');
    }
    if (parts.length >= 3) {
      desviaciones.text = parts[2];
    }
  }
}

class OrdenEquiposFormPage extends StatefulWidget {
  const OrdenEquiposFormPage({
    super.key,
    required this.orden,
    required this.equipos,
    this.readOnly = false,
  });

  final WorkOrder orden;
  final List<String> equipos;
  final bool readOnly;

  @override
  State<OrdenEquiposFormPage> createState() => _OrdenEquiposFormPageState();
}

class _OrdenEquiposFormPageState extends State<OrdenEquiposFormPage> {
  final _formKey        = GlobalKey<FormState>();
  final _conclusionCtrl = TextEditingController();

  late final Map<String, _EquipState> _equipStates;
  late int _currentStep;
  String  _desviacionGeneral  = '';
  String  _trabajoTerminado   = '';
  bool    _loading            = true;
  bool    _saving             = false;
  bool    _editingOverride    = false;

  bool get _effectiveReadOnly => widget.readOnly && !_editingOverride;

  static const _stepLabels = ['Equipos', 'Observaciones', 'Fotografías', 'Resumen'];
  static const _stepIcons  = [
    Icons.build_outlined,
    Icons.notes_outlined,
    Icons.photo_camera_outlined,
    Icons.summarize_outlined,
  ];

  @override
  void initState() {
    super.initState();
    _editingOverride = false;
    _currentStep = widget.readOnly ? 3 : 0;
    _equipStates = {
      for (final type in widget.equipos)
        type: _EquipState(requiredLabels: _equipConfigs[type]!.requiredPhotoLabels),
    };
    _cargarDatos();
  }

  @override
  void dispose() {
    _conclusionCtrl.dispose();
    for (final s in _equipStates.values) s.dispose();
    super.dispose();
  }

  

  Future<void> _cargarDatos() async {
    final orderId = widget.orden.id!;

    final report = await OrderReportRepository.instance.findByOrderId(orderId);
    if (report != null) {
      _conclusionCtrl.text = report.observaciones;
      _desviacionGeneral   = report.materiales;
      _trabajoTerminado    = report.trabajoRealizado;
    }

    for (final type in widget.equipos) {
      final st      = _equipStates[type]!;
      final eReport = await EquipmentReportRepository.instance.findByOrderAndType(orderId, type);
      if (eReport != null) {
        st.potencia.text = eReport.potencia;
        st.serial.text   = eReport.serial;
        st.marca.text    = eReport.marca;
        st.caf.text      = eReport.caf;
        st.decodeObservaciones(eReport.observaciones, _predefinedActividades[type] ?? []);
      }

      final fotos = await EquipmentPhotoRepository.instance.listByOrderAndType(orderId, type);
      for (final foto in fotos) {
        if (foto.isRequired && st.requiredPhotos.containsKey(foto.photoLabel)) {
          st.requiredPhotos[foto.photoLabel] = foto;
        } else {
          st.extraPhotos.add(foto);
        }
      }
    }

    if (mounted) setState(() => _loading = false);
  }

  

  Future<void> _guardar() async {
    setState(() => _saving = true);
    final orderId = widget.orden.id!;
    final ahora   = DateTime.now().millisecondsSinceEpoch;

    await OrderReportRepository.instance.save(OrderReport(
      orderId: orderId,
      observaciones: _conclusionCtrl.text.trim(),
      materiales: _desviacionGeneral, 
      trabajoRealizado: _trabajoTerminado,
      createdAt: ahora,
      updatedAt: ahora,
    ));

    for (final type in widget.equipos) {
      final st = _equipStates[type]!;
      await EquipmentReportRepository.instance.save(EquipmentReport(
        orderId: orderId,
        equipmentType: type,
        potencia: st.potencia.text.trim(),
        serial: st.serial.text.trim(),
        marca: st.marca.text.trim(),
        caf: st.caf.text.trim(),
        observaciones: st.encodeObservaciones(),
        createdAt: ahora,
        updatedAt: ahora,
      ));
    }

    await WorkOrderRepository.instance.updateStatus(
      id: orderId,
      status: 'finalizada',
    );

    final wasEditing = _editingOverride;
    setState(() { _saving = false; _editingOverride = false; });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(wasEditing
              ? 'Corrección guardada — listo para re-sincronizar'
              : 'Reporte guardado — listo para sincronizar'),
        ]),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ));
      Navigator.of(context).pop();
    }
  }

  

  void _nextStep() {
    if (_currentStep == 2) {
      // Validar fotos requeridas antes de ir al resumen
      final faltantes = <String>[];
      for (final type in widget.equipos) {
        final st = _equipStates[type]!;
        for (final entry in st.requiredPhotos.entries) {
          if (entry.value == null) faltantes.add('$type – ${entry.key}');
        }
      }
      if (faltantes.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Fotos requeridas pendientes: ${faltantes.join(', ')}',
              style: const TextStyle(fontSize: 12)),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 4),
        ));
        return;
      }
    }
    if (_currentStep < 3) setState(() => _currentStep++);
  }

  void _prevStep() {
    if (_currentStep > 0) setState(() => _currentStep--);
  }

  

  Future<void> _captureRequired(String equipType, String label, ImageSource source) async {
    final st = _equipStates[equipType]!;
    setState(() { st.isCapturing = true; st.capturingLabel = label; });
    try {
      final results = await Future.wait([
        _obtenerUbicacion(),
        ImagePicker().pickImage(source: source, imageQuality: 75, maxWidth: 1280),
      ]);
      final position = results[0] as Position?;
      final file     = results[1] as XFile?;
      if (file == null) return;
      if (position == null && mounted) _mostrarAdvertenciaGPS();

      final appDir   = await getApplicationDocumentsDirectory();
      final nombre   = 'eq_${widget.orden.id}_${equipType}_${label}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final destPath = p.join(appDir.path, nombre);
      await File(file.path).copy(destPath);

      final prev = st.requiredPhotos[label];
      if (prev != null && prev.id != null) {
        await EquipmentPhotoRepository.instance.delete(prev.id!);
        try { await File(prev.photoPath).delete(); } catch (_) {}
      }

      final foto = EquipmentPhoto(
        orderId: widget.orden.id!, equipmentType: equipType,
        photoLabel: label, isRequired: true, photoPath: destPath,
        latitude: position?.latitude, longitude: position?.longitude,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      );
      final id = await EquipmentPhotoRepository.instance.upsertLabeled(foto);
      if (mounted) {
        setState(() => st.requiredPhotos[label] = EquipmentPhoto(
          id: id, orderId: foto.orderId, equipmentType: foto.equipmentType,
          photoLabel: foto.photoLabel, isRequired: true, photoPath: foto.photoPath,
          latitude: foto.latitude, longitude: foto.longitude, createdAt: foto.createdAt,
        ));
      }
    } finally {
      if (mounted) setState(() { st.isCapturing = false; st.capturingLabel = null; });
    }
  }

  Future<void> _deleteRequired(String equipType, String label) async {
    final st   = _equipStates[equipType]!;
    final foto = st.requiredPhotos[label];
    if (foto == null) return;
    if (foto.id != null) {
      await EquipmentPhotoRepository.instance.delete(foto.id!);
      try { await File(foto.photoPath).delete(); } catch (_) {}
    }
    if (mounted) setState(() => st.requiredPhotos[label] = null);
  }

  Future<void> _captureExtra(String equipType, ImageSource source) async {
    final st = _equipStates[equipType]!;
    setState(() { st.isCapturing = true; st.capturingLabel = null; });
    try {
      final results = await Future.wait([
        _obtenerUbicacion(),
        ImagePicker().pickImage(source: source, imageQuality: 75, maxWidth: 1280),
      ]);
      final position = results[0] as Position?;
      final file     = results[1] as XFile?;
      if (file == null) return;
      if (position == null && mounted) _mostrarAdvertenciaGPS();

      final appDir   = await getApplicationDocumentsDirectory();
      final nombre   = 'eq_${widget.orden.id}_${equipType}_extra_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final destPath = p.join(appDir.path, nombre);
      await File(file.path).copy(destPath);

      final foto = EquipmentPhoto(
        orderId: widget.orden.id!, equipmentType: equipType,
        photoLabel: '', isRequired: false, photoPath: destPath,
        latitude: position?.latitude, longitude: position?.longitude,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      );
      final id = await EquipmentPhotoRepository.instance.add(foto);
      if (!mounted) return;
      setState(() => st.extraPhotos.add(EquipmentPhoto(
        id: id, orderId: foto.orderId, equipmentType: foto.equipmentType,
        photoLabel: '', isRequired: false, photoPath: foto.photoPath,
        latitude: foto.latitude, longitude: foto.longitude, createdAt: foto.createdAt,
      )));

      // Pedir título para la foto adicional
      _pedirTituloExtra(equipType, st.extraPhotos.length - 1, id);
    } finally {
      if (mounted) setState(() { st.isCapturing = false; st.capturingLabel = null; });
    }
  }

  void _pedirTituloExtra(String equipType, int idx, int photoId) {
    final st  = _equipStates[equipType]!;
    final ctrl = TextEditingController(text: st.extraPhotos[idx].photoLabel);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Título de la foto', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Ej: Vista lateral, Conector principal…',
            hintStyle: const TextStyle(fontSize: 12, color: Color(0xFFCDD5DF)),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF0A2E5C), width: 1.5),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Omitir', style: TextStyle(color: Color(0xFF9CA3AF)))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0A2E5C), foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            onPressed: () async {
              final titulo = ctrl.text.trim();
              Navigator.of(ctx).pop();
              if (titulo.isNotEmpty && idx < st.extraPhotos.length) {
                await EquipmentPhotoRepository.instance.updateLabel(photoId, titulo);
                if (mounted) {
                  setState(() {
                    final old = st.extraPhotos[idx];
                    st.extraPhotos[idx] = EquipmentPhoto(
                      id: old.id, orderId: old.orderId, equipmentType: old.equipmentType,
                      photoLabel: titulo, isRequired: false, photoPath: old.photoPath,
                      latitude: old.latitude, longitude: old.longitude, createdAt: old.createdAt,
                    );
                  });
                }
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteExtra(String equipType, int idx) async {
    final st   = _equipStates[equipType]!;
    final foto = st.extraPhotos[idx];
    if (foto.id != null) {
      await EquipmentPhotoRepository.instance.delete(foto.id!);
      try { await File(foto.photoPath).delete(); } catch (_) {}
    }
    if (mounted) setState(() => st.extraPhotos.removeAt(idx));
  }

  void _mostrarAdvertenciaGPS() {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Row(children: [
        Icon(Icons.location_off_rounded, color: Colors.white, size: 16),
        SizedBox(width: 8),
        Expanded(child: Text('No se obtuvo GPS. Activa la ubicación y retoma la foto.',
            style: TextStyle(fontSize: 12))),
      ]),
      backgroundColor: const Color(0xFFF59E0B),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 5),
      action: SnackBarAction(label: 'Entendido', textColor: Colors.white, onPressed: () {}),
    ));
  }

  void _mostrarOpcionesFoto({required String equipType, String? label}) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _FotoOptionsSheet(
        label: label,
        onCamera: () {
          Navigator.pop(context);
          if (label != null) {
            _captureRequired(equipType, label, ImageSource.camera);
          } else {
            _captureExtra(equipType, ImageSource.camera);
          }
        },
        onGallery: () {
          Navigator.pop(context);
          if (label != null) {
            _captureRequired(equipType, label, ImageSource.gallery);
          } else {
            _captureExtra(equipType, ImageSource.gallery);
          }
        },
      ),
    );
  }

  

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      bottomNavigationBar: _loading ? null : _NavBar(
        currentStep: _currentStep,
        saving: _saving,
        readOnly: _effectiveReadOnly,
        onPrev: _currentStep > 0 ? _prevStep : null,
        onNext: _currentStep < 3 ? _nextStep : null,
        onSave: _currentStep == 3
            ? (_effectiveReadOnly ? () => Navigator.of(context).pop() : _guardar)
            : null,
      ),
      body: Column(
        children: [
          _FormHeader(
            orden: widget.orden,
            equipos: widget.equipos,
            currentStep: _currentStep,
            stepLabels: _stepLabels,
            stepIcons: _stepIcons,
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF0A2E5C), strokeWidth: 2.5))
                : Form(
                    key: _formKey,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: KeyedSubtree(
                        key: ValueKey(_currentStep),
                        child: _buildStepContent(),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0: return _buildPaso1Equipos();
      case 1: return _buildPaso2Observaciones();
      case 2: return _buildPaso3Fotos();
      case 3: return _buildPaso4Resumen();
      default: return const SizedBox.shrink();
    }
  }

  
  
  

  Widget _buildPaso1Equipos() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      children: [
        _SectionLabel('Datos técnicos de equipos', Icons.build_outlined),
        const SizedBox(height: 4),
        const Text(
          'Confirma o corrige los datos precargados por el supervisor y registra el estado general de cada equipo.',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 20),

        ...widget.equipos.map((type) {
          final cfg = _equipConfigs[type]!;
          final st  = _equipStates[type]!;
          return _EquipoCard(
            config: cfg,
            state: st,
            onEstadoChanged: (v) => setState(() => st.estadoGeneral = v),
            readOnly: _effectiveReadOnly,
          );
        }),
      ],
    );
  }

  
  
  

  Widget _buildPaso2Observaciones() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      children: [
        _SectionLabel('Actividades y desviaciones', Icons.notes_outlined),
        const SizedBox(height: 4),
        const Text(
          'Registra las actividades realizadas y las desviaciones encontradas en cada equipo.',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 20),

        ...widget.equipos.map((type) {
          final cfg = _equipConfigs[type]!;
          final st  = _equipStates[type]!;
          return _ObservacionesCard(
            config: cfg,
            state: st,
            readOnly: _effectiveReadOnly,
            onToggleActividad: (obs) => setState(() {
              if (st.selectedActividades.contains(obs)) {
                st.selectedActividades.remove(obs);
              } else {
                st.selectedActividades.add(obs);
              }
            }),
          );
        }),

        const SizedBox(height: 8),

        
        _SectionLabel('Conclusión general', Icons.summarize_outlined),
        const SizedBox(height: 12),
        _StyledField(
          controller: _conclusionCtrl,
          label: 'Conclusión y recomendaciones',
          hint: 'Resumen ejecutivo del trabajo realizado y recomendaciones generales…',
          icon: Icons.check_circle_outline_rounded,
          minLines: 4,
          readOnly: _effectiveReadOnly,
        ),

        const SizedBox(height: 20),

        
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE8EDF3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '¿EXISTE DESVIACIÓN?',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                    color: Color(0xFF9EAFC2), letterSpacing: 0.8),
              ),
              const SizedBox(height: 4),
              const Text(
                'Aplica a toda la inspección',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 12),
              AbsorbPointer(
                absorbing: _effectiveReadOnly,
                child: Row(
                children: ['Si', 'No', 'PNC'].map((opt) {
                  final selected = _desviacionGeneral == opt;
                  Color optColor;
                  if (opt == 'Si') optColor = const Color(0xFFEF4444);
                  else if (opt == 'No') optColor = const Color(0xFF10B981);
                  else optColor = const Color(0xFFF59E0B);
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: GestureDetector(
                        onTap: () => setState(() => _desviacionGeneral = opt),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: selected ? optColor.withValues(alpha: 0.12) : const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: selected ? optColor : const Color(0xFFE5E7EB),
                              width: selected ? 1.8 : 1,
                            ),
                          ),
                          child: Text(
                            opt,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700,
                              color: selected ? optColor : const Color(0xFF6B7280),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),
      ],
    );
  }

  
  
  

  Widget _buildPaso3Fotos() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      children: [
        _SectionLabel('Registro fotográfico', Icons.photo_camera_outlined),
        const SizedBox(height: 4),
        const Text(
          'Captura las fotos requeridas y adicionales por equipo. El GPS se guardará automáticamente.',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 20),

        ...widget.equipos.map((type) {
          final cfg = _equipConfigs[type]!;
          final st  = _equipStates[type]!;
          return _FotosCard(
            config: cfg,
            state: st,
            onCaptureRequired: (label) => _mostrarOpcionesFoto(equipType: type, label: label),
            onDeleteRequired: (label) => _deleteRequired(type, label),
            onCaptureExtra: () => _mostrarOpcionesFoto(equipType: type),
            onDeleteExtra: (idx) => _deleteExtra(type, idx),
          );
        }),
      ],
    );
  }

  
  
  

  Widget _buildPaso4Resumen() {
    int totalFotos = 0;
    for (final type in widget.equipos) {
      final st = _equipStates[type]!;
      totalFotos += st.requiredPhotos.values.where((f) => f != null).length;
      totalFotos += st.extraPhotos.length;
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      children: [
        _SectionLabel('Resumen del reporte', Icons.summarize_outlined),
        const SizedBox(height: 4),
        const Text(
          'Revisa los datos antes de guardar. Puedes volver a cualquier paso para corregir.',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 20),

        _ResumenCard(
          titulo: 'Información del trabajo',
          icon: Icons.assignment_outlined,
          color: const Color(0xFF0A2E5C),
          filas: [
            _ResumenFila('Tipo', widget.orden.tipo),
            _ResumenFila('Estado', widget.orden.status),
          ],
        ),
        const SizedBox(height: 12),

        
        _ResumenCard(
          titulo: 'Estado de equipos',
          icon: Icons.build_outlined,
          color: const Color(0xFF0EA5E9),
          filas: widget.equipos.map((type) {
            final st = _equipStates[type]!;
            return _ResumenFila(
              type,
              st.estadoGeneral.isEmpty ? '—' : st.estadoGeneral,
              valueColor: st.estadoGeneral == 'Bueno'
                  ? const Color(0xFF10B981)
                  : st.estadoGeneral == 'Regular'
                      ? const Color(0xFFF59E0B)
                      : st.estadoGeneral == 'Deficiente'
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF6B7280),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),

        
        _ResumenCard(
          titulo: 'Fotografías',
          icon: Icons.photo_camera_outlined,
          color: const Color(0xFF8B5CF6),
          filas: [
            _ResumenFila('Total capturadas', '$totalFotos foto${totalFotos != 1 ? 's' : ''}'),
            ...widget.equipos.map((type) {
              final st = _equipStates[type]!;
              final n  = st.requiredPhotos.values.where((f) => f != null).length + st.extraPhotos.length;
              return _ResumenFila(type, '$n foto${n != 1 ? 's' : ''}');
            }),
          ],
        ),
        const SizedBox(height: 12),

        _ResumenCard(
          titulo: 'Resultado general',
          icon: Icons.rule_outlined,
          color: const Color(0xFFF59E0B),
          filas: [
            _ResumenFila('¿Existe desviación?',
                _desviacionGeneral.isEmpty ? '—' : _desviacionGeneral,
                valueColor: _desviacionGeneral == 'Si'
                    ? const Color(0xFFEF4444)
                    : _desviacionGeneral == 'No'
                        ? const Color(0xFF10B981)
                        : const Color(0xFFF59E0B)),
            if (_conclusionCtrl.text.trim().isNotEmpty)
              _ResumenFila('Conclusión', _conclusionCtrl.text.trim()),
          ],
        ),
        const SizedBox(height: 12),

        // Trabajo terminado
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Icon(Icons.task_alt_outlined, size: 16, color: Color(0xFF0A2E5C)),
                const SizedBox(width: 6),
                const Text('Trabajo terminado',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0A2E5C))),
              ]),
              const SizedBox(height: 10),
              if (_effectiveReadOnly)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _trabajoTerminado == 'Si'
                        ? const Color(0xFF10B981).withValues(alpha: 0.1)
                        : _trabajoTerminado == 'No'
                            ? const Color(0xFFEF4444).withValues(alpha: 0.1)
                            : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _trabajoTerminado.isEmpty ? '—' : _trabajoTerminado,
                    style: TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700,
                      color: _trabajoTerminado == 'Si'
                          ? const Color(0xFF10B981)
                          : _trabajoTerminado == 'No'
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF6B7280),
                    ),
                  ),
                )
              else
                Row(children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _trabajoTerminado = 'Si'),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _trabajoTerminado == 'Si'
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _trabajoTerminado == 'Si'
                                ? const Color(0xFF10B981)
                                : const Color(0xFFE5E7EB),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline,
                                size: 18,
                                color: _trabajoTerminado == 'Si' ? Colors.white : const Color(0xFF9CA3AF)),
                            const SizedBox(width: 6),
                            Text('Sí',
                                style: TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w700,
                                  color: _trabajoTerminado == 'Si' ? Colors.white : const Color(0xFF9CA3AF),
                                )),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _trabajoTerminado = 'No'),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _trabajoTerminado == 'No'
                              ? const Color(0xFFEF4444)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _trabajoTerminado == 'No'
                                ? const Color(0xFFEF4444)
                                : const Color(0xFFE5E7EB),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.cancel_outlined,
                                size: 18,
                                color: _trabajoTerminado == 'No' ? Colors.white : const Color(0xFF9CA3AF)),
                            const SizedBox(width: 6),
                            Text('No',
                                style: TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w700,
                                  color: _trabajoTerminado == 'No' ? Colors.white : const Color(0xFF9CA3AF),
                                )),
                          ],
                        ),
                      ),
                    ),
                  ),
                ]),
            ],
          ),
        ),

        if (widget.readOnly && !_editingOverride) ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () => setState(() {
                _editingOverride = true;
                _currentStep = 0;
              }),
              icon: const Icon(Icons.edit_outlined, size: 18),
              label: const Text('Corregir y re-enviar',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFF59E0B),
                side: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],

        const SizedBox(height: 16),
      ],
    );
  }
}

class _FormHeader extends StatelessWidget {
  const _FormHeader({
    required this.orden,
    required this.equipos,
    required this.currentStep,
    required this.stepLabels,
    required this.stepIcons,
  });

  final WorkOrder orden;
  final List<String> equipos;
  final int currentStep;
  final List<String> stepLabels;
  final List<IconData> stepIcons;

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
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                  ),
                ],
              ),

              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Reporte de ${orden.tipo}',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12)),
                    const SizedBox(height: 3),
                    Text(
                      orden.title,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),

                    
                    Row(
                      children: List.generate(stepLabels.length, (i) {
                        final isActive   = i == currentStep;
                        final isDone     = i < currentStep;
                        return Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  children: [
                                    Container(
                                      width: 30, height: 30,
                                      decoration: BoxDecoration(
                                        color: isDone
                                            ? const Color(0xFF10B981)
                                            : isActive
                                                ? Colors.white
                                                : Colors.white.withValues(alpha: 0.15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        isDone ? Icons.check_rounded : stepIcons[i],
                                        size: 15,
                                        color: isDone
                                            ? Colors.white
                                            : isActive
                                                ? const Color(0xFF0A2E5C)
                                                : Colors.white.withValues(alpha: 0.5),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      stepLabels[i],
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: isActive ? FontWeight.w700 : FontWeight.normal,
                                        color: isActive
                                            ? Colors.white
                                            : Colors.white.withValues(alpha: 0.5),
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                              if (i < stepLabels.length - 1)
                                Expanded(
                                  child: Container(
                                    height: 2,
                                    margin: const EdgeInsets.only(bottom: 18),
                                    color: i < currentStep
                                        ? const Color(0xFF10B981)
                                        : Colors.white.withValues(alpha: 0.2),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
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

class _NavBar extends StatelessWidget {
  const _NavBar({
    required this.currentStep,
    required this.saving,
    this.readOnly = false,
    this.onPrev,
    this.onNext,
    this.onSave,
  });

  final int currentStep;
  final bool saving;
  final bool readOnly;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final VoidCallback? onSave;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.07), blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: Row(
        children: [
          
          if (onPrev != null) ...[
            Expanded(
              child: SizedBox(
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: onPrev,
                  icon: const Icon(Icons.arrow_back_rounded, size: 16),
                  label: const Text('Anterior', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF0A2E5C),
                    side: const BorderSide(color: Color(0xFF0A2E5C)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],

          
          Expanded(
            flex: onPrev != null ? 1 : 2,
            child: SizedBox(
              height: 50,
              child: onSave != null
                  ? ElevatedButton.icon(
                      onPressed: saving ? null : onSave,
                      icon: readOnly
                          ? const Icon(Icons.close_rounded, size: 18)
                          : (saving
                              ? const SizedBox(width: 16, height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.save_outlined, size: 18)),
                      label: Text(
                        readOnly ? 'Cerrar' : (saving ? 'Guardando…' : 'Guardar reporte'),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: readOnly ? const Color(0xFF6B7280) : const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    )
                  : ElevatedButton.icon(
                      onPressed: onNext,
                      icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                      label: const Text('Siguiente', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0A2E5C),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EquipoCard extends StatelessWidget {
  const _EquipoCard({
    required this.config,
    required this.state,
    required this.onEstadoChanged,
    this.readOnly = false,
  });

  final _EquipConfig config;
  final _EquipState state;
  final void Function(String) onEstadoChanged;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                config.color.withValues(alpha: 0.15),
                config.color.withValues(alpha: 0.05),
              ]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: config.color.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: config.color.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(config.icon, color: config.color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(config.name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: config.color)),
                      Text(config.fullName, style: TextStyle(fontSize: 11, color: config.color.withValues(alpha: 0.7))),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          
          if (config.hasDatosGenerales) ...[
            _SubSectionLabel('Datos técnicos (precargados por supervisor)', Icons.assignment_outlined),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(child: _StyledField(controller: state.potencia, label: 'Potencia', hint: 'kVA / HP', icon: Icons.flash_on_outlined, readOnly: readOnly)),
                      const SizedBox(width: 10),
                      Expanded(child: _StyledField(controller: state.marca, label: 'Marca', hint: 'Fabricante', icon: Icons.factory_outlined, readOnly: readOnly)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _StyledField(controller: state.serial, label: 'N° Serie', hint: 'Número de serie', icon: Icons.numbers_outlined, readOnly: readOnly)),
                      const SizedBox(width: 10),
                      Expanded(child: _StyledField(controller: state.caf, label: 'N° CAF', hint: 'Código CAF', icon: Icons.qr_code_outlined, readOnly: readOnly)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          
          _SubSectionLabel('Estado general del equipo', Icons.rule_outlined),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: AbsorbPointer(
              absorbing: readOnly,
              child: Row(
              children: _estadosEquipo.map((est) {
                final selected = state.estadoGeneral == est;
                Color estColor;
                if (est == 'Bueno') estColor = const Color(0xFF10B981);
                else if (est == 'Regular') estColor = const Color(0xFFF59E0B);
                else estColor = const Color(0xFFEF4444);

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: GestureDetector(
                      onTap: () => onEstadoChanged(est),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: selected ? estColor.withValues(alpha: 0.12) : const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: selected ? estColor : const Color(0xFFE5E7EB),
                            width: selected ? 1.8 : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              est == 'Bueno' ? Icons.check_circle_outline
                                  : est == 'Regular' ? Icons.warning_amber_outlined
                                  : Icons.cancel_outlined,
                              color: selected ? estColor : const Color(0xFF9EAFC2),
                              size: 18,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              est,
                              style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w700,
                                color: selected ? estColor : const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ObservacionesCard extends StatelessWidget {
  const _ObservacionesCard({
    required this.config,
    required this.state,
    required this.onToggleActividad,
    this.readOnly = false,
  });

  final _EquipConfig config;
  final _EquipState state;
  final void Function(String) onToggleActividad;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    final predefined = _predefinedActividades[config.name] ?? [];

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: config.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(config.icon, color: config.color, size: 17),
              ),
              const SizedBox(width: 10),
              Text(config.name,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: config.color)),
              const SizedBox(width: 6),
              Text(config.fullName,
                  style: TextStyle(fontSize: 11, color: config.color.withValues(alpha: 0.7))),
            ],
          ),
          const SizedBox(height: 12),

          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                
                if (predefined.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
                    child: Text('ACTIVIDADES REALIZADAS',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                            color: config.color.withValues(alpha: 0.7), letterSpacing: 0.8)),
                  ),
                  ...predefined.map((obs) {
                    final selected = state.selectedActividades.contains(obs);
                    return AbsorbPointer(
                      absorbing: readOnly,
                      child: InkWell(
                      onTap: () => onToggleActividad(obs),
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                        child: Row(
                          children: [
                            Checkbox(
                              value: selected,
                              onChanged: (_) => onToggleActividad(obs),
                              activeColor: config.color,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              visualDensity: VisualDensity.compact,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(obs,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: selected ? const Color(0xFF1A2F4E) : const Color(0xFF6B7280),
                                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                                  )),
                            ),
                          ],
                        ),
                      ),
                    ),
                    );
                  }),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
                    child: Text('ACTIVIDADES ADICIONALES',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                            color: config.color.withValues(alpha: 0.7), letterSpacing: 0.8)),
                  ),
                ],

                
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
                  child: _StyledField(
                    controller: state.actividadesLibres,
                    label: 'Otras actividades',
                    hint: 'Anota actividades adicionales…',
                    icon: Icons.edit_outlined,
                    minLines: 2,
                    readOnly: readOnly,
                  ),
                ),

                
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
                  child: Text('DESVIACIONES ENCONTRADAS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                          color: const Color(0xFFEF4444).withValues(alpha: 0.8), letterSpacing: 0.8)),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 4, 14, 14),
                  child: _StyledField(
                    controller: state.desviaciones,
                    label: 'Hallazgos y anomalías',
                    hint: 'Describe desviaciones, anomalías o recomendaciones encontradas…',
                    icon: Icons.warning_amber_outlined,
                    minLines: 3,
                    readOnly: readOnly,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FotosCard extends StatelessWidget {
  const _FotosCard({
    required this.config,
    required this.state,
    required this.onCaptureRequired,
    required this.onDeleteRequired,
    required this.onCaptureExtra,
    required this.onDeleteExtra,
  });

  final _EquipConfig config;
  final _EquipState state;
  final void Function(String label) onCaptureRequired;
  final void Function(String label) onDeleteRequired;
  final VoidCallback onCaptureExtra;
  final void Function(int idx) onDeleteExtra;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: config.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(config.icon, color: config.color, size: 17),
              ),
              const SizedBox(width: 10),
              Text(config.name,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: config.color)),
              const SizedBox(width: 6),
              Text(config.fullName,
                  style: TextStyle(fontSize: 11, color: config.color.withValues(alpha: 0.7))),
            ],
          ),
          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('FOTOS REQUERIDAS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                        color: Color(0xFF9EAFC2), letterSpacing: 0.8)),
                const SizedBox(height: 10),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.1,
                  children: config.requiredPhotoLabels.map((label) {
                    final foto = state.requiredPhotos[label];
                    final isCapturing = state.isCapturing && state.capturingLabel == label;
                    return _RequiredPhotoSlot(
                      label: label,
                      photo: foto,
                      color: config.color,
                      isCapturing: isCapturing,
                      onTap: () => onCaptureRequired(label),
                      onDelete: () => onDeleteRequired(label),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    const Text('FOTOS ADICIONALES',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                            color: Color(0xFF9EAFC2), letterSpacing: 0.8)),
                    const Spacer(),
                    Text('${state.extraPhotos.length}/${config.maxExtraPhotos}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF9EAFC2))),
                  ],
                ),
                const SizedBox(height: 10),

                if (state.extraPhotos.isNotEmpty) ...[
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1),
                    itemCount: state.extraPhotos.length,
                    itemBuilder: (_, i) => _ExtraPhotoTile(
                      photo: state.extraPhotos[i], numero: i + 1, onDelete: () => onDeleteExtra(i)),
                  ),
                  const SizedBox(height: 10),
                ],

                if (state.isCapturing && state.capturingLabel == null)
                  _CapturingIndicator()
                else if (state.extraPhotos.length < config.maxExtraPhotos)
                  GestureDetector(
                    onTap: onCaptureExtra,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: config.color.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: config.color.withValues(alpha: 0.25)),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.add_a_photo_outlined, color: config.color, size: 22),
                          const SizedBox(height: 4),
                          Text('Agregar foto adicional',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: config.color)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResumenCard extends StatelessWidget {
  const _ResumenCard({
    required this.titulo,
    required this.icon,
    required this.color,
    required this.filas,
  });
  final String titulo;
  final IconData icon;
  final Color color;
  final List<_ResumenFila> filas;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8EDF3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 8),
                Text(titulo, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: filas.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 110,
                      child: Text(f.label,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF9EAFC2), fontWeight: FontWeight.w600)),
                    ),
                    Expanded(
                      child: Text(f.value,
                          style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600,
                            color: f.valueColor ?? const Color(0xFF1A2F4E),
                          )),
                    ),
                  ],
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResumenFila {
  final String label;
  final String value;
  final Color? valueColor;
  const _ResumenFila(this.label, this.value, {this.valueColor});
}

class _RequiredPhotoSlot extends StatelessWidget {
  const _RequiredPhotoSlot({
    required this.label, required this.photo, required this.color,
    required this.isCapturing, required this.onTap, required this.onDelete,
  });
  final String label;
  final EquipmentPhoto? photo;
  final Color color;
  final bool isCapturing;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    if (isCapturing) {
      return Container(
        decoration: BoxDecoration(color: const Color(0xFFF9FAFB), borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE5E7EB))),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: color)),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF9EAFC2))),
        ]),
      );
    }
    if (photo != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Stack(fit: StackFit.expand, children: [
          Image.file(File(photo!.photoPath), fit: BoxFit.cover,
              errorBuilder: (_, e, s) => Container(color: const Color(0xFFE5E7EB),
                  child: const Icon(Icons.broken_image_outlined, color: Color(0xFF9CA3AF)))),
          Positioned(bottom: 0, left: 0, right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4), color: Colors.black54,
                child: Row(children: [
                  Icon(Icons.check_circle_rounded, color: color, size: 12),
                  const SizedBox(width: 4),
                  Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
                ]),
              )),
          Positioned(top: 4, right: 4,
              child: GestureDetector(onTap: onDelete,
                  child: Container(width: 24, height: 24,
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(Icons.close_rounded, color: Colors.white, size: 14)))),
        ]),
      );
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.add_a_photo_outlined, color: color, size: 24),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          Text('Toca para capturar', style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.6))),
        ]),
      ),
    );
  }
}

class _ExtraPhotoTile extends StatelessWidget {
  const _ExtraPhotoTile({required this.photo, required this.numero, required this.onDelete});
  final EquipmentPhoto photo;
  final int numero;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final titulo = photo.photoLabel.isNotEmpty ? photo.photoLabel : 'Extra #$numero';
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Stack(fit: StackFit.expand, children: [
        Image.file(File(photo.photoPath), fit: BoxFit.cover,
            errorBuilder: (_, e, s) => Container(color: const Color(0xFFE5E7EB),
                child: const Icon(Icons.broken_image_outlined, color: Color(0xFF9CA3AF), size: 24))),
        Positioned(bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
              color: Colors.black54,
              child: Text(titulo,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w600)),
            )),
        Positioned(top: 2, right: 2,
            child: GestureDetector(onTap: onDelete,
                child: Container(width: 22, height: 22,
                    decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                    child: const Icon(Icons.close_rounded, color: Colors.white, size: 13)))),
        if (photo.hasLocation)
          Positioned(top: 2, left: 2,
              child: Container(width: 10, height: 10,
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle))),
      ]),
    );
  }
}

class _CapturingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0A2E5C))),
        SizedBox(width: 8),
        Text('Obteniendo ubicación y foto…', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
      ]),
    );
  }
}

class _FotoOptionsSheet extends StatelessWidget {
  const _FotoOptionsSheet({required this.onCamera, required this.onGallery, this.label});
  final String? label;
  final VoidCallback onCamera;
  final VoidCallback onGallery;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4,
                  decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 20),
              Text(label != null ? 'Foto: $label' : 'Foto adicional',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1A2F4E))),
              const SizedBox(height: 4),
              const Text('GPS se guardará automáticamente',
                  style: TextStyle(fontSize: 12, color: Color(0xFF9EAFC2))),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _SheetOption(icon: Icons.camera_alt_outlined, label: 'Cámara', color: const Color(0xFF0A2E5C), onTap: onCamera)),
                  const SizedBox(width: 12),
                  Expanded(child: _SheetOption(icon: Icons.photo_library_outlined, label: 'Galería', color: const Color(0xFF8B5CF6), onTap: onGallery)),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _SheetOption extends StatelessWidget {
  const _SheetOption({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ]),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, this.icon);
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF0A2E5C).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 15, color: const Color(0xFF0A2E5C)),
        ),
        const SizedBox(width: 10),
        Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1A2F4E))),
      ],
    );
  }
}

class _SubSectionLabel extends StatelessWidget {
  const _SubSectionLabel(this.text, this.icon);
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: const Color(0xFF9EAFC2)),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
            color: Color(0xFF9EAFC2), letterSpacing: 0.3)),
      ],
    );
  }
}

class _StyledField extends StatelessWidget {
  const _StyledField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.minLines = 1,
    this.required = false,
    this.readOnly = false,
  });
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final int minLines;
  final bool required;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      minLines: minLines,
      maxLines: null,
      readOnly: readOnly,
      validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Campo requerido' : null : null,
      style: const TextStyle(fontSize: 13, color: Color(0xFF1A2F4E)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: Color(0xFF9EAFC2), fontWeight: FontWeight.w500),
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFFCDD5DF)),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 14, right: 10),
          child: Icon(icon, size: 17, color: const Color(0xFF0A2E5C)),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        alignLabelWithHint: true,
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE8EDF3))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE8EDF3))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0A2E5C), width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.2)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5)),
      ),
    );
  }
}
