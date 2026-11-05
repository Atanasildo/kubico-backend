import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../providers/auth_provider.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

// Imóveis angolanos representativos — URLs públicas de Unsplash
const _kBgImages = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _form      = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();

  int    _bgIndex  = 0;
  Timer? _bgTimer;

  late final AnimationController _fadeCtrl;
  late final Animation<double>    _fadeAnim;
  late final AnimationController _slideCtrl;
  late final Animation<Offset>    _slideAnim;

  @override
  void initState() {
    super.initState();

    // Slideshow timer
    _bgTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() => _bgIndex = (_bgIndex + 1) % _kBgImages.length);
    });

    // Form fade-in
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);

    // Form slide-up
    _slideCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));

    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) { _fadeCtrl.forward(); _slideCtrl.forward(); }
    });
  }

  @override
  void dispose() {
    _bgTimer?.cancel();
    _fadeCtrl.dispose();
    _slideCtrl.dispose();
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(email: _emailCtrl.text.trim(), senha: _senhaCtrl.text);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro ao entrar.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Slideshow background ──────────────────────────────────────────
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 1200),
            transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
            child: Image.network(
              _kBgImages[_bgIndex],
              key: ValueKey(_bgIndex),
              fit: BoxFit.cover,
              width: size.width,
              height: size.height,
              errorBuilder: (_, __, ___) => Container(color: AppColors.background),
            ),
          ),

          // ── Dark gradient overlay ─────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x55000000),
                  Color(0xCC000000),
                  Color(0xF0000000),
                ],
                stops: [0.0, 0.4, 1.0],
              ),
            ),
          ),

          // ── Form content ──────────────────────────────────────────────────
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: SlideTransition(
                position: _slideAnim,
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: Form(
                    key: _form,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const SizedBox(height: 32),
                      // Logo
                      Row(children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.home_rounded, color: Colors.white, size: 22)),
                        const SizedBox(width: 10),
                        const Text('kubico',
                          style: TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w700,
                            letterSpacing: -0.5, color: Colors.white)),
                      ]),
                      SizedBox(height: size.height * 0.22),
                      const Text('Bem-vindo de volta',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 6),
                      const Text('Entra na tua conta para continuar',
                        style: TextStyle(fontSize: 14, color: Colors.white70)),
                      const SizedBox(height: 32),

                      // Email
                      KubicoTextField(
                        label: 'Email', controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: Icons.email_outlined,
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Insere o teu email';
                          if (!v.contains('@')) return 'Email inválido';
                          return null;
                        }),
                      const SizedBox(height: 16),

                      // Senha
                      KubicoTextField(
                        label: 'Senha', controller: _senhaCtrl, obscure: true,
                        prefixIcon: Icons.lock_outlined,
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Insere a tua senha';
                          if (v.length < 8) return 'Mínimo 8 caracteres';
                          return null;
                        }),
                      const SizedBox(height: 8),

                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                          child: const Text('Esqueceste a senha?',
                            style: TextStyle(color: AppColors.primary, fontSize: 13)))),
                      const SizedBox(height: 20),

                      KubicoButton(label: 'Entrar', onPressed: _submit, loading: auth.loading),
                      const SizedBox(height: 24),

                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Text('Ainda não tens conta?',
                          style: TextStyle(color: Colors.white70, fontSize: 14)),
                        TextButton(
                          onPressed: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const RegisterScreen())),
                          child: const Text('Regista-te',
                            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600))),
                      ]),

                      // Dots indicador do slideshow
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(_kBgImages.length, (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: i == _bgIndex ? 20 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: i == _bgIndex ? AppColors.primary : Colors.white38,
                            borderRadius: BorderRadius.circular(3)),
                        )),
                      ),
                    ]),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
