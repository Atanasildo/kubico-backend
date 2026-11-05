import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../features/properties/presentation/screens/home_screen.dart';
import '../features/properties/presentation/screens/search_screen.dart';
import '../features/publish/presentation/screens/publish_screen.dart';
import '../features/dashboard/presentation/screens/favorites_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    SearchScreen(),
    PublishScreen(),
    FavoritesScreen(),
    DashboardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5))),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(icon: Icons.home_outlined,       activeIcon: Icons.home_rounded,     label: 'Início',    index: 0, current: _index, onTap: (i) => setState(() => _index = i)),
              _NavItem(icon: Icons.search_outlined,      activeIcon: Icons.search,           label: 'Pesquisar', index: 1, current: _index, onTap: (i) => setState(() => _index = i)),
              _PublishBtn(active: _index == 2, onTap: () => setState(() => _index = 2)),
              _NavItem(icon: Icons.favorite_outline,     activeIcon: Icons.favorite,         label: 'Favoritos', index: 3, current: _index, onTap: (i) => setState(() => _index = i)),
              _NavItem(icon: Icons.person_outline,       activeIcon: Icons.person,           label: 'Perfil',    index: 4, current: _index, onTap: (i) => setState(() => _index = i)),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon, required this.activeIcon, required this.label,
    required this.index, required this.current, required this.onTap,
  });
  final IconData icon, activeIcon;
  final String   label;
  final int      index, current;
  final void Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(active ? activeIcon : icon,
            color: active ? AppColors.primary : AppColors.textSecondary,
            size: 22),
          const SizedBox(height: 3),
          Text(label, style: TextStyle(
            fontSize: 10, fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            color: active ? AppColors.primary : AppColors.textSecondary)),
        ]),
      ),
    );
  }
}

class _PublishBtn extends StatelessWidget {
  const _PublishBtn({required this.active, required this.onTap});
  final bool active;
  final VoidCallback onTap;
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 46, height: 46,
          decoration: BoxDecoration(
            color: active ? AppColors.primaryDark : AppColors.primary,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(
              color: AppColors.primary.withOpacity(0.35),
              blurRadius: 10, offset: const Offset(0, 4))]),
          child: const Icon(Icons.add, color: Colors.white, size: 26)),
        const SizedBox(height: 3),
        Text('Publicar', style: TextStyle(
          fontSize: 10,
          fontWeight: active ? FontWeight.w600 : FontWeight.w400,
          color: active ? AppColors.primary : AppColors.textSecondary)),
      ]),
    ),
  );
}
