import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../properties/data/property_model.dart';
import '../../../properties/data/property_repository.dart';
import '../../../properties/presentation/widgets/property_card.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});
  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final _repo = PropertyRepository();
  late Future<List<PropertyModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.getFavorites();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Favoritos')),
      body: FutureBuilder<List<PropertyModel>>(
        future: _future,
        builder: (_, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (snap.hasError || snap.data == null || snap.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.favorite_border, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 12),
                  const Text('Ainda não tens favoritos',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => setState(() => _future = _repo.getFavorites()),
                    child: const Text('Recarregar', style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: snap.data!.length,
            itemBuilder: (_, i) => PropertyCard(property: snap.data![i]),
          );
        },
      ),
    );
  }
}
