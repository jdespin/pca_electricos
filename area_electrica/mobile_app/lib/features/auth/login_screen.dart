import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/session_repository.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _usuarioCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  bool _loading = false;
  bool _obscurePass = true;
  bool _rememberPassword = false;

  String? _usuarioError;
  String? _passError;

  late final AnimationController _animCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
    _loadRememberedPassword();
  }

  Future<void> _loadRememberedPassword() async {
    final saved = await SessionRepository.instance.getRememberedPassword();
    if (saved != null && mounted) {
      setState(() {
        _passCtrl.text = saved;
        _rememberPassword = true;
      });
    }
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _usuarioCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  bool _validateForm() {
    final usuario = _usuarioCtrl.text.trim();
    final pass = _passCtrl.text;
    bool valid = true;

    if (usuario.isEmpty) {
      _usuarioError = 'Ingresa tu usuario';
      valid = false;
    } else if (usuario.length < 3) {
      _usuarioError = 'El usuario debe tener al menos 3 caracteres';
      valid = false;
    } else {
      _usuarioError = null;
    }

    if (pass.isEmpty) {
      _passError = 'Ingresa tu contraseña';
      valid = false;
    } else if (pass.length < 8) {
      _passError = 'La contraseña debe tener mínimo 8 caracteres';
      valid = false;
    } else {
      _passError = null;
    }

    setState(() {});
    return valid;
  }

  Future<void> _onLogin() async {
    if (!_validateForm()) return;

    setState(() => _loading = true);

    final usuario = _usuarioCtrl.text.trim();
    final pass = _passCtrl.text;

    final result = await AuthRepository.instance.login(
      usuario: usuario,
      password: pass,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (!result.success) {
      setState(() {
        _passError = result.mensaje ?? 'Usuario o contraseña incorrectos';
      });
      return;
    }

    await SessionRepository.instance.saveSession(usuario);
    await SessionRepository.instance.saveIdUsuario(result.idUsuario!);
    await SessionRepository.instance.saveRoles(result.roles);

    if (_rememberPassword) {
      await SessionRepository.instance.saveRememberedPassword(pass);
    } else {
      await SessionRepository.instance.clearRememberedPassword();
    }

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A2E5C),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    
                    Container(
                      width: 80,
                      height: 80,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.15),
                          width: 1.5,
                        ),
                      ),
                      child: SvgPicture.asset(
                        'assets/images/pca.svg',
                        colorFilter: const ColorFilter.mode(
                          Colors.white,
                          BlendMode.srcIn,
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    const Text(
                      'Área Eléctrica',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Inicia sesión para continuar',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 13,
                      ),
                    ),

                    const SizedBox(height: 40),

                    
                    _InputField(
                      controller: _usuarioCtrl,
                      label: 'Usuario',
                      icon: Icons.person_outline_rounded,
                      error: _usuarioError,
                      onChanged: (_) {
                        if (_usuarioError != null) {
                          setState(() => _usuarioError = null);
                        }
                      },
                    ),

                    const SizedBox(height: 16),

                    
                    _InputField(
                      controller: _passCtrl,
                      label: 'Contraseña',
                      icon: Icons.lock_outline_rounded,
                      error: _passError,
                      obscure: _obscurePass,
                      onToggleObscure: () =>
                          setState(() => _obscurePass = !_obscurePass),
                      onChanged: (_) {
                        if (_passError != null) {
                          setState(() => _passError = null);
                        }
                      },
                    ),

                    const SizedBox(height: 12),

                    
                    Row(
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: Checkbox(
                            value: _rememberPassword,
                            onChanged: (v) =>
                                setState(() => _rememberPassword = v ?? false),
                            activeColor: const Color(0xFF4A90D9),
                            checkColor: Colors.white,
                            side: BorderSide(
                              color: Colors.white.withValues(alpha: 0.4),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Recordar contraseña',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.65),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 28),

                    
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _onLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4A90D9),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor:
                              const Color(0xFF4A90D9).withValues(alpha: 0.5),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Ingresar',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.3,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final String? error;
  final bool obscure;
  final VoidCallback? onToggleObscure;
  final ValueChanged<String>? onChanged;

  const _InputField({
    required this.controller,
    required this.label,
    required this.icon,
    this.error,
    this.obscure = false,
    this.onToggleObscure,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final hasError = error != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasError
                  ? const Color(0xFFFF6B6B)
                  : Colors.white.withValues(alpha: 0.15),
              width: 1.2,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: obscure,
            onChanged: onChanged,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: InputDecoration(
              hintText: label,
              hintStyle: TextStyle(
                color: Colors.white.withValues(alpha: 0.4),
                fontSize: 14,
              ),
              prefixIcon: Icon(
                icon,
                color: Colors.white.withValues(alpha: 0.45),
                size: 20,
              ),
              suffixIcon: onToggleObscure != null
                  ? IconButton(
                      icon: Icon(
                        obscure
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: Colors.white.withValues(alpha: 0.45),
                        size: 20,
                      ),
                      onPressed: onToggleObscure,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFFF6B6B),
                  size: 13,
                ),
                const SizedBox(width: 4),
                Text(
                  error!,
                  style: const TextStyle(
                    color: Color(0xFFFF6B6B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
