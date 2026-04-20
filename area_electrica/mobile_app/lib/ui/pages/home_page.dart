import 'package:flutter/material.dart';
import '../../data/repositories/session_repository.dart';
import '../../data/repositories/equipo_interno_repository.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, this.nombre = '', this.apellido = ''});

  final String nombre;
  final String apellido;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  List<EquipoInterno> _equiposLibres = [];
  List<UsoEquipoActivo> _misEquipos = [];
  bool _loadingEquipos = true;
  bool _estaOffline = false;

  String get _fullName => '${widget.nombre} ${widget.apellido}'.trim();

  String get _initials {
    final n = widget.nombre.isNotEmpty ? widget.nombre[0].toUpperCase() : '';
    final a = widget.apellido.isNotEmpty ? widget.apellido[0].toUpperCase() : '';
    return '$n$a';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && _loadingEquipos) {
        _cargarEquipos();
      }
      setState(() {});
    });
    _cargarEquipos();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.nombre.isEmpty && widget.nombre.isNotEmpty) {
      _cargarEquipos();
    }
  }

  Future<void> _cargarEquipos() async {
    final cached = await EquipoInternoRepository.instance.preloadFromCache();
    if (mounted) {
      setState(() {
        _equiposLibres  = cached.libres;
        _misEquipos     = cached.mios;
        _loadingEquipos = cached.libres.isEmpty && cached.mios.isEmpty;
      });
    }

    final mios   = await EquipoInternoRepository.instance.fetchMisEquiposActivos();
    final libres = await EquipoInternoRepository.instance.fetchEquiposLibres();
    if (!mounted) return;
    setState(() {
      _misEquipos     = mios.datos;
      _equiposLibres  = libres.datos;
      _estaOffline    = mios.offline || libres.offline;
      _loadingEquipos = false;
    });
  }

  Future<void> _reservar(EquipoInterno equipo) async {
    final ok = await EquipoInternoRepository.instance.reservarEquipo(
      equipo.idequipointerno,
      _fullName,
    );
    if (!mounted) return;
    if (ok) {
      await _cargarEquipos();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al reservar el equipo. Intenta de nuevo.')),
      );
    }
  }

  Future<void> _devolver(UsoEquipoActivo uso) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('¿Devolver equipo?',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('Se registrará la devolución de ${uso.strequipo}.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0A2E5C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Devolver'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final ok = await EquipoInternoRepository.instance.devolverEquipo(uso.idequipointerno);
    if (!mounted) return;
    if (ok) {
      await _cargarEquipos();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al devolver el equipo. Intenta de nuevo.')),
      );
    }
  }

  void _logout(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('¿Cerrar sesión?',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('Tendrás que volver a iniciar sesión para continuar.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0A2E5C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              final nav = Navigator.of(context);
              Navigator.of(ctx).pop();
              await SessionRepository.instance.clearSession();
              await SessionRepository.instance.clearPerfilCache();
              nav.pushReplacementNamed('/login');
            },
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: Column(
        children: [
          _Header(
            nombre: widget.nombre,
            initials: _initials,
            tabController: _tabController,
            onLogout: () => _logout(context),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _OrdenesTab(context: context),

                RefreshIndicator(
                  onRefresh: _cargarEquipos,
                  child: _EquiposTab(
                    loading: _loadingEquipos,
                    offline: _estaOffline,
                    misEquipos: _misEquipos,
                    equiposLibres: _equiposLibres,
                    onDevolver: _devolver,
                    onSolicitar: _reservar,
                    onRefresh: _cargarEquipos,
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

class _Header extends StatelessWidget {
  const _Header({
    required this.nombre,
    required this.initials,
    required this.tabController,
    required this.onLogout,
  });

  final String nombre;
  final String initials;
  final TabController tabController;
  final VoidCallback onLogout;

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
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 20, 16, 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initials.isEmpty ? '?' : initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bienvenido,',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.65),
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          nombre.isNotEmpty ? nombre : '...',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onLogout,
                    tooltip: 'Cerrar sesión',
                    icon: Icon(
                      Icons.logout_rounded,
                      color: Colors.white.withValues(alpha: 0.75),
                      size: 22,
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: TabBar(
                  controller: tabController,
                  padding: const EdgeInsets.all(4),
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.10),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: const Color(0xFF0A2E5C),
                  unselectedLabelColor: Colors.white.withValues(alpha: 0.75),
                  labelStyle: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  tabs: const [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_outlined, size: 16),
                          SizedBox(width: 6),
                          Text('Órdenes'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.construction_rounded, size: 16),
                          SizedBox(width: 6),
                          Text('Equipos'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrdenesTab extends StatelessWidget {
  const _OrdenesTab({required this.context});

  final BuildContext context;

  @override
  Widget build(BuildContext ctx) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Órdenes de trabajo',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A2F4E),
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 16),

          _OrderCard(
            title: 'En Proceso',
            subtitle: 'Órdenes activas en ejecución',
            icon: Icons.autorenew_rounded,
            accentColor: const Color(0xFF4A90D9),
            onTap: () => Navigator.pushNamed(context, '/ordenes/proceso'),
          ),
          const SizedBox(height: 14),

          _OrderCard(
            title: 'Finalizadas',
            subtitle: 'Órdenes completadas pendientes de evaluación',
            icon: Icons.check_circle_outline_rounded,
            accentColor: const Color(0xFF27AE7A),
            onTap: () => Navigator.pushNamed(context, '/ordenes/finalizadas'),
          ),
          const SizedBox(height: 14),

          _OrderCard(
            title: 'Evaluadas',
            subtitle: 'Órdenes con evaluación de supervisor',
            icon: Icons.assignment_turned_in_outlined,
            accentColor: const Color(0xFF8B6FD4),
            onTap: () => Navigator.pushNamed(context, '/ordenes/evaluadas'),
          ),
        ],
      ),
    );
  }
}

class _EquiposTab extends StatelessWidget {
  const _EquiposTab({
    required this.loading,
    required this.offline,
    required this.misEquipos,
    required this.equiposLibres,
    required this.onDevolver,
    required this.onSolicitar,
    required this.onRefresh,
  });

  final bool loading;
  final bool offline;
  final List<UsoEquipoActivo> misEquipos;
  final List<EquipoInterno> equiposLibres;
  final Future<void> Function(UsoEquipoActivo) onDevolver;
  final Future<void> Function(EquipoInterno) onSolicitar;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Equipos y herramientas',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A2F4E),
                  letterSpacing: 0.2,
                ),
              ),
              const Spacer(),
              if (!loading)
                GestureDetector(
                  onTap: onRefresh,
                  child: const Icon(Icons.refresh_rounded,
                      size: 20, color: Color(0xFF4A90D9)),
                ),
            ],
          ),
          if (offline)
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.wifi_off_rounded, size: 16, color: Color(0xFFF97316)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Sin conexión — mostrando datos en caché',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFC2410C),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          if (loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: CircularProgressIndicator(
                  color: Color(0xFF0A2E5C),
                  strokeWidth: 2,
                ),
              ),
            )
          else ...[
            if (misEquipos.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  'Mis equipos en uso (${misEquipos.length})',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6B7280),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              ...misEquipos.map((uso) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _MiEquipoCard(
                      equipo: uso,
                      onDevolver: () => onDevolver(uso),
                    ),
                  )),
              const SizedBox(height: 8),
              const Divider(height: 1, color: Color(0xFFE5E7EB)),
              const SizedBox(height: 18),
            ],

            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                'Disponibles (${equiposLibres.length})',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7280),
                  letterSpacing: 0.2,
                ),
              ),
            ),

            if (equiposLibres.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Column(
                    children: [
                      Icon(Icons.build_circle_outlined,
                          size: 36, color: Color(0xFFD1D5DB)),
                      SizedBox(height: 10),
                      Text(
                        'No hay equipos disponibles en este momento.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              ...equiposLibres.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _EquipoLibreCard(
                      equipo: e,
                      reservado: misEquipos.any((u) => u.idequipointerno == e.idequipointerno),
                      onSolicitar: () => onSolicitar(e),
                    ),
                  )),
          ],
        ],
      ),
    );
  }
}

class _MiEquipoCard extends StatelessWidget {
  const _MiEquipoCard({required this.equipo, required this.onDevolver});

  final UsoEquipoActivo equipo;
  final VoidCallback onDevolver;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2E5C), Color(0xFF1A5FA8)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.5)),
                ),
                child: const Text(
                  'En uso',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.orange,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'Desde ${_formatFecha(equipo.dtfechainicio)}',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.construction_rounded,
                    color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      equipo.strequipo,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${equipo.strmarca} · ${equipo.strmodelo}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      'S/N: ${equipo.strserie}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onDevolver,
              icon: const Icon(Icons.keyboard_return_rounded, size: 16),
              label: const Text('Devolver equipo'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF0A2E5C),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                textStyle: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatFecha(DateTime dt) {
    final h  = dt.hour.toString().padLeft(2, '0');
    final mi = dt.minute.toString().padLeft(2, '0');
    final d  = dt.day.toString().padLeft(2, '0');
    final mo = dt.month.toString().padLeft(2, '0');
    return '$d/$mo $h:$mi';
  }
}

class _EquipoLibreCard extends StatelessWidget {
  const _EquipoLibreCard({
    required this.equipo,
    required this.reservado,
    required this.onSolicitar,
  });

  final EquipoInterno equipo;
  final bool reservado;
  final VoidCallback onSolicitar;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF27AE7A).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.build_circle_outlined,
                  color: Color(0xFF27AE7A), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    equipo.strequipo,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF1A2F4E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${equipo.strmarca} · ${equipo.strmodelo}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                  Text(
                    'S/N: ${equipo.strserie}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[400],
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: reservado ? null : onSolicitar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0A2E5C),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                textStyle: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 12),
                disabledBackgroundColor: Colors.grey[200],
              ),
              child: Text(reservado ? 'En uso' : 'Solicitar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: accentColor, size: 26),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A2F4E),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded,
                  color: Colors.grey[300], size: 22),
            ],
          ),
        ),
      ),
    );
  }
}
