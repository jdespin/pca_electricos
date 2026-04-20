import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/session_repository.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({
    super.key,
    required this.nombre,
    required this.apellido,
    required this.cedula,
    required this.celular,
    required this.tipoSangre,
    required this.correo,
  });

  final String nombre;
  final String apellido;
  final String cedula;
  final String celular;
  final String tipoSangre;
  final String correo;

  String get _initials {
    final n = nombre.isNotEmpty ? nombre[0].toUpperCase() : '';
    final a = apellido.isNotEmpty ? apellido[0].toUpperCase() : '';
    return '$n$a';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _ProfileHeader(
              nombre: nombre,
              apellido: apellido,
              initials: _initials,
              tipoSangre: tipoSangre,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([

                
                _SectionLabel(
                  icon: Icons.person_outline_rounded,
                  title: 'Información personal',
                  color: const Color(0xFF4A90D9),
                ),
                const SizedBox(height: 12),

                
                Row(children: [
                  Expanded(child: _InfoTile(
                    icon: Icons.badge_outlined,
                    label: 'Cédula',
                    value: cedula.isNotEmpty ? cedula : '—',
                    color: const Color(0xFF4A90D9),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _InfoTile(
                    icon: Icons.phone_outlined,
                    label: 'Celular',
                    value: celular.isNotEmpty ? celular : '—',
                    color: const Color(0xFF27AE7A),
                  )),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _InfoTile(
                    icon: Icons.bloodtype_outlined,
                    label: 'Tipo de sangre',
                    value: tipoSangre.isNotEmpty ? tipoSangre : '—',
                    color: const Color(0xFFFF5252),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _InfoTile(
                    icon: Icons.engineering_outlined,
                    label: 'Cargo',
                    value: 'Técnico de campo',
                    color: const Color(0xFFFF7043),
                  )),
                ]),
                const SizedBox(height: 12),

                
                _InfoTileFull(
                  icon: Icons.email_outlined,
                  label: 'Correo electrónico',
                  value: correo.isNotEmpty ? correo : '—',
                  color: const Color(0xFF8B6FD4),
                ),

                const SizedBox(height: 12),

                
                _InfoTileFull(
                  icon: Icons.electrical_services_outlined,
                  label: 'Área',
                  value: 'Área Eléctrica — PCA',
                  color: const Color(0xFFFF9800),
                ),

                const SizedBox(height: 28),

                
                _SectionLabel(
                  icon: Icons.calendar_month_outlined,
                  title: 'Jornada de trabajo',
                  color: const Color(0xFF27AE7A),
                ),
                const SizedBox(height: 12),
                const _WorkCalendar(),

              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.nombre,
    required this.apellido,
    required this.initials,
    required this.tipoSangre,
  });

  final String nombre, apellido, initials, tipoSangre;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF062147), Color(0xFF0A2E5C), Color(0xFF1A5FA8)],
          stops: [0.0, 0.5, 1.0],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(36),
          bottomRight: Radius.circular(36),
        ),
      ),
      child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      
                      Container(
                        width: 130, height: 130,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                      
                      Container(
                        width: 110, height: 110,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF2472C8), Color(0xFF0A2E5C)],
                          ),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.5),
                            width: 2.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0A2E5C).withValues(alpha: 0.5),
                              blurRadius: 20,
                              spreadRadius: 2,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initials.isEmpty ? '?' : initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 38,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      
                      Positioned(
                        bottom: 4, right: 4,
                        child: Container(
                          width: 16, height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFF27AE7A),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF062147), width: 2.5),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  
                  Text(
                    '$nombre $apellido',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.2,
                    ),
                  ),

                  const SizedBox(height: 10),

                  
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [
                      _HeaderChip(
                        icon: Icons.engineering_outlined,
                        label: 'Técnico de campo',
                        bgColor: Colors.white.withValues(alpha: 0.12),
                        borderColor: Colors.white.withValues(alpha: 0.2),
                      ),
                      _HeaderChip(
                        icon: Icons.electrical_services_outlined,
                        label: 'Área Eléctrica',
                        bgColor: const Color(0xFF4A90D9).withValues(alpha: 0.25),
                        borderColor: const Color(0xFF4A90D9).withValues(alpha: 0.4),
                      ),
                      if (tipoSangre.isNotEmpty)
                        _HeaderChip(
                          icon: Icons.bloodtype_outlined,
                          label: tipoSangre,
                          bgColor: const Color(0xFFFF5252).withValues(alpha: 0.2),
                          borderColor: const Color(0xFFFF5252).withValues(alpha: 0.4),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
    );
  }
}

class _HeaderChip extends StatelessWidget {
  const _HeaderChip({
    required this.icon,
    required this.label,
    required this.bgColor,
    required this.borderColor,
  });

  final IconData icon;
  final String label;
  final Color bgColor, borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 13),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({
    required this.icon,
    required this.title,
    required this.color,
  });

  final IconData icon;
  final String title;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4, height: 20,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 7),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A2F4E),
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label, value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: color, size: 19),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF9EAFC2),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A2F4E),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _InfoTileFull extends StatelessWidget {
  const _InfoTileFull({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label, value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF9EAFC2),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2F4E),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WorkCalendar extends StatefulWidget {
  const _WorkCalendar();

  @override
  State<_WorkCalendar> createState() => _WorkCalendarState();
}

class _WorkCalendarState extends State<_WorkCalendar> {
  late DateTime _mes;
  Set<String> _trabajoDates  = {};
  Set<String> _descansoDates = {};
  bool _cargando = true;

  static const _meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  static const _diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _mes = DateTime(now.year, now.month);
    _fetchTurnos();
  }

  Future<void> _fetchTurnos() async {
    try {
      final idUsuario = await SessionRepository.instance.getIdUsuario();
      if (idUsuario == null) { if (mounted) setState(() => _cargando = false); return; }

      final uri = Uri.parse(
        '${AuthRepository.baseUrl}/rutatecnicoturno/ObtenerTurnosTecnico/$idUsuario',
      );
      final resp = await http.get(uri).timeout(const Duration(seconds: 10));

      if (resp.statusCode == 200) {
        final data  = jsonDecode(resp.body) as Map<String, dynamic>;
        final lista = (data['datos'] as List<dynamic>?) ?? [];
        final trabajo  = <String>{};
        final descanso = <String>{};
        for (final d in lista) {
          final fecha = d['dtfecha'] as String?;
          final tipo  = ((d['strtipo'] as String?) ?? 'TRABAJO').toUpperCase();
          if (fecha != null) {
            if (tipo == 'TRABAJO') trabajo.add(fecha);
            else descanso.add(fecha);
          }
        }
        if (mounted) setState(() {
          _trabajoDates  = trabajo;
          _descansoDates = descanso;
          _cargando      = false;
        });
      } else {
        if (mounted) setState(() => _cargando = false);
      }
    } catch (_) {
      if (mounted) setState(() => _cargando = false);
    }
  }

  String _fechaKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  String _estadoDia(DateTime d) {
    final k = _fechaKey(d);
    if (_trabajoDates.contains(k))  return 'TRABAJO';
    if (_descansoDates.contains(k)) return 'DESCANSO';
    return 'NINGUNO';
  }

  void _prevMes() => setState(() => _mes = DateTime(_mes.year, _mes.month - 1));
  void _nextMes() => setState(() => _mes = DateTime(_mes.year, _mes.month + 1));

  @override
  Widget build(BuildContext context) {
    final hoy    = DateTime.now();
    final today  = DateTime(hoy.year, hoy.month, hoy.day);
    final estadoHoy = _estadoDia(today);

    final primerDia = DateTime(_mes.year, _mes.month, 1);
    final offset    = primerDia.weekday - 1;
    final diasEnMes = DateUtils.getDaysInMonth(_mes.year, _mes.month);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: _cargando
            ? const SizedBox(
                height: 120,
                child: Center(child: CircularProgressIndicator(
                  color: Color(0xFF4A90D9), strokeWidth: 2)),
              )
            : Column(
                children: [
                  _StatusBanner(estado: estadoHoy),

                  const SizedBox(height: 20),

                  Row(children: [
                    _NavBtn(icon: Icons.chevron_left_rounded,  onTap: _prevMes),
                    Expanded(
                      child: Text(
                        '${_meses[_mes.month - 1]} ${_mes.year}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A2F4E),
                        ),
                      ),
                    ),
                    _NavBtn(icon: Icons.chevron_right_rounded, onTap: _nextMes),
                  ]),

                  const SizedBox(height: 14),

                  Row(
                    children: _diasSemana.map((d) => Expanded(
                      child: Text(
                        d,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF9EAFC2),
                          letterSpacing: 0.5,
                        ),
                      ),
                    )).toList(),
                  ),

                  const SizedBox(height: 10),

                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      mainAxisSpacing: 5,
                      crossAxisSpacing: 4,
                      childAspectRatio: 1,
                    ),
                    itemCount: offset + diasEnMes,
                    itemBuilder: (_, idx) {
                      if (idx < offset) return const SizedBox.shrink();
                      final dia   = idx - offset + 1;
                      final fecha = DateTime(_mes.year, _mes.month, dia);
                      return _DiaCell(
                        dia:    dia,
                        estado: _estadoDia(fecha),
                        esHoy:  fecha == today,
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFEEF2F7)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _LegendDot(
                          color: const Color(0xFF4A90D9),
                          label: 'Trabajo',
                        ),
                        const SizedBox(width: 24),
                        _LegendDot(
                          color: const Color(0xFF8B6FD4),
                          label: 'Descanso',
                        ),
                        const SizedBox(width: 24),
                        _LegendDot(
                          color: const Color(0xFFE8EDF3),
                          label: 'Sin asignar',
                          textColor: const Color(0xFF9EAFC2),
                          borderColor: const Color(0xFFCDD5DF),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.estado});

  final String estado;

  @override
  Widget build(BuildContext context) {
    final Color mainColor;
    final Color gradStart;
    final Color gradEnd;
    final IconData icon;
    final String label;
    final String sub;

    switch (estado) {
      case 'TRABAJO':
        mainColor = const Color(0xFF4A90D9);
        gradStart = const Color(0xFF1A5FA8);
        gradEnd   = const Color(0xFF4A90D9);
        icon      = Icons.work_outline_rounded;
        label     = 'En turno activo';
        sub       = 'Hoy tienes jornada de trabajo';
        break;
      case 'DESCANSO':
        mainColor = const Color(0xFF8B6FD4);
        gradStart = const Color(0xFF6B4FC8);
        gradEnd   = const Color(0xFF8B6FD4);
        icon      = Icons.weekend_outlined;
        label     = 'En período de descanso';
        sub       = 'Hoy es tu día de descanso';
        break;
      default:
        mainColor = const Color(0xFF6B7280);
        gradStart = const Color(0xFF4B5563);
        gradEnd   = const Color(0xFF6B7280);
        icon      = Icons.event_note_outlined;
        label     = 'Sin jornada asignada';
        sub       = 'El supervisor no ha asignado jornada para hoy';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [gradStart, gradEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: mainColor.withValues(alpha: 0.35),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                )),
              const SizedBox(height: 3),
              Text(sub,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.8),
                )),
            ],
          ),
        ),
      ]),
    );
  }
}

class _DiaCell extends StatelessWidget {
  const _DiaCell({required this.dia, required this.estado, required this.esHoy});

  final int    dia;
  final String estado;
  final bool   esHoy;

  @override
  Widget build(BuildContext context) {
    final Color cellColor;
    final Color textColor;

    if (esHoy) {
      cellColor = estado == 'TRABAJO'
          ? const Color(0xFF4A90D9)
          : estado == 'DESCANSO'
              ? const Color(0xFF8B6FD4)
              : const Color(0xFF6B7280);
      textColor = Colors.white;
    } else if (estado == 'TRABAJO') {
      cellColor = const Color(0xFF4A90D9).withValues(alpha: 0.12);
      textColor = const Color(0xFF1A5FA8);
    } else if (estado == 'DESCANSO') {
      cellColor = const Color(0xFF8B6FD4).withValues(alpha: 0.12);
      textColor = const Color(0xFF6B4FC8);
    } else {
      cellColor = const Color(0xFFF0F4F8);
      textColor = const Color(0xFF9EAFC2);
    }

    return Container(
      decoration: BoxDecoration(
        color: cellColor,
        borderRadius: BorderRadius.circular(8),
        boxShadow: esHoy ? [
          BoxShadow(
            color: (estado == 'TRABAJO'
                ? const Color(0xFF4A90D9)
                : estado == 'DESCANSO'
                    ? const Color(0xFF8B6FD4)
                    : const Color(0xFF6B7280))
                .withValues(alpha: 0.4),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ] : null,
      ),
      alignment: Alignment.center,
      child: Text(
        '$dia',
        style: TextStyle(
          fontSize: 12,
          fontWeight: esHoy ? FontWeight.w800 : FontWeight.w500,
          color: textColor,
        ),
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  const _NavBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34, height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F4F8),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFDDE3ED)),
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF1A2F4E)),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({
    required this.color,
    required this.label,
    this.textColor = const Color(0xFF4A5568),
    this.borderColor = Colors.transparent,
  });

  final Color color, textColor, borderColor;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12, height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: borderColor),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: textColor,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
