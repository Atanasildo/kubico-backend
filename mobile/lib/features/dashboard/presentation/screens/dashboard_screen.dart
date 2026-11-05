import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../properties/data/property_model.dart';
import '../../../properties/data/property_repository.dart';
import '../../../properties/presentation/widgets/property_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _repo = PropertyRepository();
  late Future<List<PropertyModel>> _myListings;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _myListings = _repo.getProperties();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

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
            delegate: _TabBarDelegate(TabBar(
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
            // Tab 1 — Anúncios
            FutureBuilder<List<PropertyModel>>(
              future: _myListings,
              builder: (_, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                if (snap.data == null || snap.data!.isEmpty) {
                  return const Center(
                    child: Text('Ainda não tens anúncios.',
                      style: TextStyle(color: AppColors.textSecondary)));
                }
                return ListView.builder(
                  itemCount: snap.data!.length,
                  itemBuilder: (_, i) => PropertyCard(property: snap.data![i]),
                );
              },
            ),
            // Tab 2 — Conta
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _AccountTile(icon: Icons.person_outline, label: 'Editar perfil', onTap: () {}),
                _AccountTile(icon: Icons.lock_outline, label: 'Alterar senha', onTap: () {}),
                _AccountTile(icon: Icons.verified_outlined, label: 'Verificar conta', onTap: () {}),
                if (user?.isAgente == true)
                  _AccountTile(icon: Icons.business_outlined, label: 'Plano Agente', onTap: () {}),
                _AccountTile(icon: Icons.payment_outlined, label: 'Pagamentos', onTap: () {}),
                const Divider(height: 32),
                _AccountTile(
                  icon: Icons.logout,
                  label: 'Sair',
                  color: AppColors.error,
                  onTap: () async {
                    final confirm = await showDialog<bool>(
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
                    if (confirm == true && context.mounted) {
                      context.read<AuthProvider>().logout();
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.auth});
  final AuthProvider auth;

  @override
  Widget build(BuildContext context) {
    final user = auth.user;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
      color: AppColors.background,
      child: Row(children: [
        CircleAvatar(
          radius: 36,
          backgroundColor: AppColors.primary,
          backgroundImage: user?.fotoPerfil != null ? NetworkImage(user!.fotoPerfil!) : null,
          child: user?.fotoPerfil == null
              ? Text(user?.nome.substring(0, 1).toUpperCase() ?? 'K',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white))
              : null,
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(user?.nome ?? '',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            Text(user?.email ?? '',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            if (user?.isAgente == true)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('Agente', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
              ),
          ]),
        ),
      ]),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({required this.icon, required this.label, required this.onTap, this.color});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(vertical: 2),
    leading: Icon(icon, color: color ?? AppColors.textSecondary),
    title: Text(label, style: TextStyle(color: color ?? AppColors.textPrimary)),
    trailing: color == null ? const Icon(Icons.chevron_right, color: AppColors.textSecondary) : null,
    onTap: onTap,
  );
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  const _TabBarDelegate(this.tabBar);
  final TabBar tabBar;

  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: AppColors.background, child: tabBar);
  }

  @override
  bool shouldRebuild(_) => false;
}
