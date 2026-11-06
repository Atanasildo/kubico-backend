import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/card_action.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../payments/presentation/screens/destaque_screen.dart';
import '../../../profile/presentation/screens/change_password_screen.dart';
import '../../../profile/presentation/screens/edit_profile_screen.dart';
import '../../../profile/presentation/screens/verification_screen.dart';
import '../../../properties/data/property_model.dart';
import '../../../properties/data/property_repository.dart';
import '../../../properties/presentation/screens/edit_property_screen.dart';
import '../../../properties/presentation/widgets/property_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _repo = PropertyRepository();
  late Future<List<PropertyModel>> _myFuture;

  @override
  void initState() {
    super.initState();
    _tabs     = TabController(length: 2, vsync: this);
    _myFuture = _repo.myProperties();
  }

  @override void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverToBoxAdapter(child: _ProfileHeader(auth: auth)),
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabDelegate(TabBar(
              controller: _tabs,
              indicatorColor: AppColors.primary,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              tabs: const [Tab(text: 'Meus anúncios'), Tab(text: 'Conta')],
            )),
          ),
        ],
        body: TabBarView(
          controller: _tabs,
          children: [
            // ── Tab: Anúncios ─────────────────────────────────────────────
            FutureBuilder<List<PropertyModel>>(
              future: _myFuture,
              builder: (_, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                if (snap.data == null || snap.data!.isEmpty) {
                  return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.home_work_outlined, size: 56, color: AppColors.textHint),
                    const SizedBox(height: 12),
                    const Text('Ainda não tens anúncios.',
                      style: TextStyle(color: AppColors.textSecondary)),
                  ]));
                }
                return ListView.builder(
                  itemCount: snap.data!.length,
                  itemBuilder: (_, i) {
                    final p = snap.data![i];
                    return PropertyCard(
                      property: p,
                      actions: [
                        CardAction(
                          icon: Icons.edit_outlined, label: 'Editar',
                          onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => EditPropertyScreen(property: p)))),
                        CardAction(
                          icon: Icons.star_outline, label: 'Destaque',
                          onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => DestaqueScreen(property: p)))),
                      ],
                    );
                  },
                );
              },
            ),

            // ── Tab: Conta ────────────────────────────────────────────────
            ListView(padding: const EdgeInsets.all(16), children: [
              if (user?.emailVerificado == false)
                _AlertTile(
                  icon: Icons.email_outlined, label: 'Verificar email',
                  color: AppColors.warning,
                  onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const VerificationScreen(canal: 'email')))),
              if (user?.telefoneVerificado == false && user?.telefone != null)
                _AlertTile(
                  icon: Icons.phone_outlined, label: 'Verificar telefone',
                  color: AppColors.warning,
                  onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const VerificationScreen(canal: 'telefone')))),
              const SizedBox(height: 8),
              _Tile(icon: Icons.person_outline, label: 'Editar perfil',
                onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const EditProfileScreen()))),
              _Tile(icon: Icons.lock_outline, label: 'Alterar senha',
                onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const ChangePasswordScreen()))),
              if (user?.isAdmin == true)
                _Tile(
                  icon: Icons.admin_panel_settings_outlined,
                  label: 'Painel admin',
                  color: AppColors.primary,
                  onTap: () async {
                    final uri = Uri.parse('https://frontend-9l8i-ten.vercel.app/admin');
                    // url_launcher
                    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
                  }),
              if (user?.isAgente == true && user?.isAdmin == false)
                _Tile(icon: Icons.business_outlined, label: 'Plano agente', onTap: () {}),
              _Tile(icon: Icons.payment_outlined, label: 'Histórico de pagamentos', onTap: () {}),
              const Divider(height: 32),
              _Tile(
                icon: Icons.logout, label: 'Terminar sessão', color: AppColors.error,
                onTap: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      backgroundColor: AppColors.surface,
                      title: const Text('Terminar sessão'),
                      content: const Text('Tens a certeza?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                        TextButton(onPressed: () => Navigator.pop(context, true),
                          child: const Text('Sair', style: TextStyle(color: AppColors.error))),
                      ],
                    ),
                  );
                  if (ok == true && context.mounted) context.read<AuthProvider>().logout();
                }),
            ]),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.auth});
  final AuthProvider auth;
  @override Widget build(BuildContext context) {
    final user = auth.user;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
      color: AppColors.background,
      child: Row(children: [
        CircleAvatar(
          radius: 36, backgroundColor: AppColors.primary,
          backgroundImage: user?.fotoPerfil != null ? NetworkImage(user!.fotoPerfil!) : null,
          child: user?.fotoPerfil == null
              ? Text(user?.nome.isNotEmpty == true ? user!.nome[0].toUpperCase() : 'K',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white))
              : null),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(user?.nome ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          Text(user?.email ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          if (user?.isAdmin == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
              child: const Text('Admin',
                style: TextStyle(fontSize: 11, color: Colors.orange, fontWeight: FontWeight.w600)))
          else if (user?.isAgente == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
              child: const Text('Agente',
                style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600))),
        ])),
      ]),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.label, required this.onTap, this.color});
  final IconData icon; final String label; final VoidCallback onTap; final Color? color;
  @override Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 2),
    leading: Icon(icon, color: color ?? AppColors.textSecondary),
    title: Text(label, style: TextStyle(color: color ?? AppColors.textPrimary)),
    trailing: color == null ? const Icon(Icons.chevron_right, color: AppColors.textSecondary) : null,
    onTap: onTap);
}

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3))),
      child: Row(children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 10),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500, fontSize: 13)),
        const Spacer(),
        Icon(Icons.chevron_right, color: color, size: 18),
      ])));
}

class _TabDelegate extends SliverPersistentHeaderDelegate {
  const _TabDelegate(this.tabBar);
  final TabBar tabBar;
  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;
  @override Widget build(BuildContext ctx, double shrinkOffset, bool overlap) =>
      Container(color: AppColors.background, child: tabBar);
  @override bool shouldRebuild(_) => false;
}
