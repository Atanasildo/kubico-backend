import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../features/properties/presentation/screens/home_screen.dart';
import '../features/properties/presentation/screens/search_screen.dart';
import '../features/publish/presentation/screens/publish_screen.dart';
import '../features/dashboard/presentation/screens/favorites_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
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
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined),  activeIcon: Icon(Icons.home_rounded), label: 'Início'),
          BottomNavigationBarItem(icon: Icon(Icons.search),          label: 'Pesquisar'),
          BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline, color: AppColors.primary, size: 32), label: 'Publicar'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_outline), activeIcon: Icon(Icons.favorite), label: 'Favoritos'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline),   activeIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}
