import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:geolocator/geolocator.dart';

import '../../data/models/work_order.dart';
import '../../data/models/order_report.dart';
import '../../data/models/order_photo.dart';
import '../../data/repositories/order_report_repository.dart';
import '../../data/repositories/order_photo_repository.dart';



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



class OrdenFormPage extends StatefulWidget {
  const OrdenFormPage({super.key, required this.orden});
  final WorkOrder orden;

  @override
  State<OrdenFormPage> createState() => _OrdenFormPageState();
}

class _OrdenFormPageState extends State<OrdenFormPage> {
  final _formKey        = GlobalKey<FormState>();
  final _obsController  = TextEditingController();
  final _matController  = TextEditingController();
  final _trabajoController = TextEditingController();

  List<OrderPhoto> _fotos = [];
  bool _loading        = true;
  bool _saving         = false;
  bool _capturandoFoto = false;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  @override
  void dispose() {
    _obsController.dispose();
    _matController.dispose();
    _trabajoController.dispose();
    super.dispose();
  }

  

  Future<void> _cargarDatos() async {
    final orderId = widget.orden.id!;
    final report  = await OrderReportRepository.instance.findByOrderId(orderId);
    final fotos   = await OrderPhotoRepository.instance.listByOrderId(orderId);
    if (mounted) {
      setState(() {
        if (report != null) {
          _obsController.text    = report.observaciones;
          _matController.text    = report.materiales;
          _trabajoController.text = report.trabajoRealizado;
        }
        _fotos   = fotos;
        _loading = false;
      });
    }
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final ahora = DateTime.now().millisecondsSinceEpoch;
    await OrderReportRepository.instance.save(
      OrderReport(
        orderId: widget.orden.id!,
        observaciones: _obsController.text.trim(),
        materiales: _matController.text.trim(),
        trabajoRealizado: _trabajoController.text.trim(),
        createdAt: ahora,
        updatedAt: ahora,
      ),
    );

    setState(() => _saving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(children: [
            Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Formulario guardado correctamente'),
          ]),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _agregarFoto(ImageSource source) async {
    setState(() => _capturandoFoto = true);
    try {
      final results = await Future.wait([
        _obtenerUbicacion(),
        ImagePicker().pickImage(
          source: source,
          imageQuality: 75,
          maxWidth: 1280,
        ),
      ]);

      final position = results[0] as Position?;
      final file     = results[1] as XFile?;
      if (file == null) return;

      
      if (position == null && mounted) {
        _mostrarAdvertenciaGPS();
      }

      final appDir  = await getApplicationDocumentsDirectory();
      final nombre  = 'orden_${widget.orden.id}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final destPath = p.join(appDir.path, nombre);
      await File(file.path).copy(destPath);

      final foto = OrderPhoto(
        orderId: widget.orden.id!,
        photoPath: destPath,
        latitude: position?.latitude,
        longitude: position?.longitude,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      );
      final id = await OrderPhotoRepository.instance.add(foto);

      if (mounted) {
        setState(() => _fotos.add(OrderPhoto(
              id: id,
              orderId: foto.orderId,
              photoPath: foto.photoPath,
              latitude: foto.latitude,
              longitude: foto.longitude,
              createdAt: foto.createdAt,
            )));
      }
    } finally {
      if (mounted) setState(() => _capturandoFoto = false);
    }
  }

  void _mostrarAdvertenciaGPS() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(children: [
          Icon(Icons.location_off_rounded, color: Colors.white, size: 16),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'No se obtuvo GPS. Activa la ubicación y retoma la foto.',
              style: TextStyle(fontSize: 12),
            ),
          ),
        ]),
        backgroundColor: const Color(0xFFF59E0B),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 5),
        action: SnackBarAction(
          label: 'Entendido',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }

  Future<void> _eliminarFoto(OrderPhoto foto) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar foto',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('¿Deseas eliminar esta fotografía?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar',
                style: TextStyle(color: Color(0xFF6B7280))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    await OrderPhotoRepository.instance.delete(foto.id!);
    try { await File(foto.photoPath).delete(); } catch (_) {}
    if (mounted) setState(() => _fotos.remove(foto));
  }

  void _mostrarOpcionesFoto() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _FotoOptionsSheet(
        onCamera: () {
          Navigator.pop(context);
          _agregarFoto(ImageSource.camera);
        },
        onGallery: () {
          Navigator.pop(context);
          _agregarFoto(ImageSource.gallery);
        },
      ),
    );
  }

  void _verFotoCompleta(OrderPhoto foto, int numero) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _VistaFotoPage(foto: foto, numero: numero),
      ),
    );
  }

  String _formatFecha(int epochMs) {
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs);
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')}/'
        '${dt.year}';
  }

  

  @override
  Widget build(BuildContext context) {
    final orden     = widget.orden;
    final tipoColor = _tipoColor(orden.tipo);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      
      bottomNavigationBar: _loading
          ? null
          : _SaveBar(saving: _saving, onSave: _guardar),
      body: Column(
        children: [
          
          _FormHeader(orden: orden),

          
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(
                    color: Color(0xFF0A2E5C), strokeWidth: 2.5))
                : Form(
                    key: _formKey,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                      children: [

                        
                        _OrderSummaryCard(
                          orden: orden,
                          tipoColor: tipoColor,
                          fecha: _formatFecha(orden.createdAt),
                        ),

                        const SizedBox(height: 24),

                        
                        _SectionLabel(
                          'Datos del trabajo',
                          Icons.edit_note_rounded,
                        ),
                        const SizedBox(height: 12),

                        _FieldCard(
                          controller: _obsController,
                          label: 'Observaciones',
                          hint: 'Describe lo que encontraste al llegar al sitio…',
                          icon: Icons.visibility_outlined,
                          minLines: 3,
                        ),
                        const SizedBox(height: 12),
                        _FieldCard(
                          controller: _matController,
                          label: 'Materiales utilizados',
                          hint: 'Ej: 2 breakers 20A, 5m cable AWG 12…',
                          icon: Icons.inventory_2_outlined,
                          minLines: 2,
                        ),
                        const SizedBox(height: 12),
                        _FieldCard(
                          controller: _trabajoController,
                          label: 'Trabajo realizado',
                          hint: 'Describe las acciones ejecutadas…',
                          icon: Icons.handyman_outlined,
                          minLines: 3,
                          required: true,
                        ),

                        const SizedBox(height: 24),

                        
                        Row(
                          children: [
                            Expanded(
                              child: _SectionLabel(
                                'Fotografías',
                                Icons.photo_camera_outlined,
                              ),
                            ),
                            _FotosCountBadge(count: _fotos.length),
                          ],
                        ),
                        const SizedBox(height: 12),

                        _FotosSection(
                          fotos: _fotos,
                          capturando: _capturandoFoto,
                          onAdd: _mostrarOpcionesFoto,
                          onDelete: _eliminarFoto,
                          onTap: (foto, idx) =>
                              _verFotoCompleta(foto, idx + 1),
                        ),

                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}



class _FormHeader extends StatelessWidget {
  const _FormHeader({required this.orden});
  final WorkOrder orden;

  @override
  Widget build(BuildContext context) {
    final tipoColor = _tipoColor(orden.tipo);

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
          padding: const EdgeInsets.fromLTRB(8, 8, 20, 22),
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
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      '#${orden.id ?? '-'}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    
                    Text(
                      'Formulario de orden',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    
                    Text(
                      orden.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: tipoColor.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: tipoColor.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_tipoIcon(orden.tipo),
                              color: Colors.white, size: 12),
                          const SizedBox(width: 5),
                          Text(
                            _tipoLabel(orden.tipo),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
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



class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({
    required this.orden,
    required this.tipoColor,
    required this.fecha,
  });

  final WorkOrder orden;
  final Color tipoColor;
  final String fecha;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: tipoColor,
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.info_outline_rounded,
                        size: 14, color: Color(0xFF9EAFC2)),
                    const SizedBox(width: 6),
                    const Text(
                      'INFORMACIÓN GENERAL',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF9EAFC2),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  orden.description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF374151),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _MiniChip(
                      icon: Icons.calendar_today_outlined,
                      label: fecha,
                      color: const Color(0xFF4A90D9),
                    ),
                    const SizedBox(width: 8),
                    _MiniChip(
                      icon: Icons.tag_rounded,
                      label: 'ID ${orden.id ?? '-'}',
                      color: const Color(0xFF6B7280),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({
    required this.icon,
    required this.label,
    required this.color,
  });
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
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
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF0A2E5C).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 15, color: const Color(0xFF0A2E5C)),
        ),
        const SizedBox(width: 10),
        Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A2F4E),
          ),
        ),
      ],
    );
  }
}



class _FieldCard extends StatelessWidget {
  const _FieldCard({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.minLines = 2,
    this.required = false,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final int minLines;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      minLines: minLines,
      maxLines: null,
      validator: required
          ? (v) =>
              (v == null || v.trim().isEmpty) ? 'Este campo es requerido' : null
          : null,
      style: const TextStyle(fontSize: 13, color: Color(0xFF1A2F4E)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(
            fontSize: 13, color: Color(0xFF9EAFC2), fontWeight: FontWeight.w500),
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFFCDD5DF)),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 14, right: 10),
          child: Icon(icon, size: 18, color: const Color(0xFF0A2E5C)),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        alignLabelWithHint: true,
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE8EDF3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE8EDF3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: Color(0xFF0A2E5C), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: Color(0xFFEF4444), width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: Color(0xFFEF4444), width: 1.5),
        ),
      ),
    );
  }
}



class _FotosCountBadge extends StatelessWidget {
  const _FotosCountBadge({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF0A2E5C).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$count foto${count != 1 ? 's' : ''}',
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Color(0xFF0A2E5C),
        ),
      ),
    );
  }
}

class _FotosSection extends StatelessWidget {
  const _FotosSection({
    required this.fotos,
    required this.capturando,
    required this.onAdd,
    required this.onDelete,
    required this.onTap,
  });

  final List<OrderPhoto> fotos;
  final bool capturando;
  final VoidCallback onAdd;
  final Future<void> Function(OrderPhoto) onDelete;
  final void Function(OrderPhoto, int) onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (fotos.isNotEmpty) ...[
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.88,
            ),
            itemCount: fotos.length,
            itemBuilder: (_, i) => _FotoThumbnail(
              foto: fotos[i],
              numero: i + 1,
              onTap: () => onTap(fotos[i], i),
              onDelete: () => onDelete(fotos[i]),
            ),
          ),
          const SizedBox(height: 12),
        ],

        
        if (capturando)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE8EDF3)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Color(0xFF0A2E5C)),
                ),
                SizedBox(width: 10),
                Text(
                  'Obteniendo ubicación y foto…',
                  style: TextStyle(
                      fontSize: 13, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          )
        else
          
          GestureDetector(
            onTap: onAdd,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                color: const Color(0xFF0A2E5C).withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF0A2E5C).withValues(alpha: 0.2),
                  width: 1.5,
                  
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0A2E5C).withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.add_a_photo_outlined,
                        color: Color(0xFF0A2E5C), size: 20),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Agregar fotografía',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0A2E5C),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Cámara o galería · GPS automático',
                    style: TextStyle(
                      fontSize: 11,
                      color: const Color(0xFF0A2E5C).withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}



class _FotoThumbnail extends StatelessWidget {
  const _FotoThumbnail({
    required this.foto,
    required this.numero,
    required this.onTap,
    required this.onDelete,
  });

  final OrderPhoto foto;
  final int numero;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  String _formatHora(int epochMs) {
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs);
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          fit: StackFit.expand,
          children: [
            
            Image.file(
              File(foto.photoPath),
              fit: BoxFit.cover,
              errorBuilder: (_, e, s) => Container(
                color: const Color(0xFFE5E7EB),
                child: const Center(
                  child: Icon(Icons.broken_image_outlined,
                      size: 36, color: Color(0xFF9CA3AF)),
                ),
              ),
            ),

            
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.fromLTRB(8, 16, 8, 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: foto.hasLocation
                            ? const Color(0xFF10B981)
                            : const Color(0xFF9CA3AF),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatHora(foto.createdAt),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            
            Positioned(
              top: 8,
              left: 8,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '#$numero',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),

            
            Positioned(
              top: 6,
              right: 6,
              child: GestureDetector(
                onTap: onDelete,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close_rounded,
                      color: Colors.white, size: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}



class _SaveBar extends StatelessWidget {
  const _SaveBar({required this.saving, required this.onSave});
  final bool saving;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: saving ? null : onSave,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0A2E5C),
            foregroundColor: Colors.white,
            disabledBackgroundColor:
                const Color(0xFF0A2E5C).withValues(alpha: 0.5),
            elevation: 0,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14)),
          ),
          child: saving
              ? const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    ),
                    SizedBox(width: 10),
                    Text('Guardando…',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.save_outlined, size: 18),
                    SizedBox(width: 8),
                    Text('Guardar cambios',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                ),
        ),
      ),
    );
  }
}



class _FotoOptionsSheet extends StatelessWidget {
  const _FotoOptionsSheet({required this.onCamera, required this.onGallery});
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
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Agregar fotografía',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2F4E)),
              ),
              const SizedBox(height: 6),
              const Text(
                'La ubicación GPS se guardará automáticamente',
                style:
                    TextStyle(fontSize: 12, color: Color(0xFF9EAFC2)),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _SheetOption(
                      icon: Icons.camera_alt_outlined,
                      label: 'Cámara',
                      color: const Color(0xFF0A2E5C),
                      onTap: onCamera,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SheetOption(
                      icon: Icons.photo_library_outlined,
                      label: 'Galería',
                      color: const Color(0xFF8B5CF6),
                      onTap: onGallery,
                    ),
                  ),
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
  const _SheetOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
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
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}



class _VistaFotoPage extends StatelessWidget {
  const _VistaFotoPage({required this.foto, required this.numero});
  final OrderPhoto foto;
  final int numero;

  String _formatFechaHora(int epochMs) {
    final dt = DateTime.fromMillisecondsSinceEpoch(epochMs);
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')}/'
        '${dt.year}  '
        '${dt.hour.toString().padLeft(2, '0')}:'
        '${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(
          'Foto #$numero',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Center(
            child: InteractiveViewer(
              child: Image.file(
                File(foto.photoPath),
                errorBuilder: (_, e, s) => const Center(
                  child: Icon(Icons.broken_image_outlined,
                      size: 60, color: Colors.white54),
                ),
              ),
            ),
          ),

          
          Positioned(
            bottom: 24,
            left: 16,
            right: 16,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  
                  Row(
                    children: [
                      const Icon(Icons.access_time_rounded,
                          color: Colors.white70, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        _formatFechaHora(foto.createdAt),
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        foto.hasLocation
                            ? Icons.location_on_rounded
                            : Icons.location_off_rounded,
                        color: foto.hasLocation
                            ? const Color(0xFF10B981)
                            : Colors.white38,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      foto.hasLocation
                          ? Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Lat: ${foto.latitude!.toStringAsFixed(6)}',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  'Lng: ${foto.longitude!.toStringAsFixed(6)}',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500),
                                ),
                              ],
                            )
                          : const Text(
                              'Ubicación no disponible',
                              style: TextStyle(
                                  color: Colors.white38, fontSize: 12),
                            ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
