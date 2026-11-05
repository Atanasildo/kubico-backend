import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import 'property_model.dart';

class PropertyRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<List<PropertyModel>> getProperties({
    int page = 1,
    int limit = 20,
    String? tipoNegocio,
    String? tipoImovel,
    String? provincia,
    double? precoMin,
    double? precoMax,
    int? quartosMin,
    String? search,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (tipoNegocio != null) 'tipo_negocio': tipoNegocio,
      if (tipoImovel != null) 'tipo_imovel': tipoImovel,
      if (provincia != null) 'provincia': provincia,
      if (precoMin != null) 'preco_min': precoMin,
      if (precoMax != null) 'preco_max': precoMax,
      if (quartosMin != null) 'quartos_min': quartosMin,
      if (search != null && search.isNotEmpty) 'q': search,
    };
    final res = await _dio.get(ApiEndpoints.properties, queryParameters: params);
    final items = res.data['items'] as List? ?? res.data as List? ?? [];
    return items.map((e) => PropertyModel.fromJson(e)).toList();
  }

  Future<PropertyModel> getProperty(String id) async {
    final res = await _dio.get(ApiEndpoints.property(id));
    return PropertyModel.fromJson(res.data);
  }

  Future<List<PropertyModel>> getFavorites() async {
    final res = await _dio.get(ApiEndpoints.favorites);
    final items = res.data as List? ?? [];
    return items.map((e) => PropertyModel.fromJson(e['property'] ?? e)).toList();
  }

  Future<bool> toggleFavorite(String propertyId) async {
    try {
      final res = await _dio.post(ApiEndpoints.favoriteToggle(propertyId));
      return res.data['favorited'] ?? true;
    } catch (_) {
      return false;
    }
  }

  Future<PropertyModel> createProperty(Map<String, dynamic> data) async {
    final res = await _dio.post(ApiEndpoints.properties, data: data);
    return PropertyModel.fromJson(res.data);
  }
}
