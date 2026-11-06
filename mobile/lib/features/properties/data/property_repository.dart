import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import 'property_model.dart';

class PropertyRepository {
  final Dio _dio = ApiClient.instance.dio;

  // ── Pesquisa / feed ──────────────────────────────────────────────────────
  Future<List<PropertyModel>> search({
    int skip = 0,
    int limit = 20,
    String? tipoNegocio,
    String? tipoImovel,
    String? provincia,
    String? municipio,
    String? bairro,
    double? precoMin,
    double? precoMax,
    int? quartosMin,
    bool apenasVerificados = false,
    String? q,
  }) async {
    final params = <String, dynamic>{
      'skip': skip,
      'limit': limit,
      if (tipoNegocio != null) 'tipo_negocio': tipoNegocio,
      if (tipoImovel != null) 'tipo_imovel': tipoImovel,
      if (provincia != null) 'provincia': provincia,
      if (municipio != null) 'municipio': municipio,
      if (bairro != null) 'bairro': bairro,
      if (precoMin != null) 'preco_min': precoMin,
      if (precoMax != null) 'preco_max': precoMax,
      if (quartosMin != null) 'quartos_min': quartosMin,
      if (apenasVerificados) 'apenas_verificados': true,
      if (q != null && q.isNotEmpty) 'q': q,
    };
    final res = await _dio.get(ApiEndpoints.properties,
      queryParameters: params);
    final raw = res.data;
    final list = raw is List ? raw : (raw['items'] ?? raw['data'] ?? []) as List;
    return list.map((e) => PropertyModel.fromJson(e)).toList();
  }

  // ── Detalhe ──────────────────────────────────────────────────────────────
  Future<PropertyModel> getById(String id) async {
    final res = await _dio.get(ApiEndpoints.property(id));
    return PropertyModel.fromJson(res.data);
  }

  // ── Meus anúncios ────────────────────────────────────────────────────────
  Future<List<PropertyModel>> myProperties() async {
    final res = await _dio.get(ApiEndpoints.myProperties);
    final list = res.data as List? ?? [];
    return list.map((e) => PropertyModel.fromJson(e)).toList();
  }

  // ── Favoritos ────────────────────────────────────────────────────────────
  Future<List<PropertyModel>> getFavorites() async {
    final res = await _dio.get(ApiEndpoints.favorites);
    final list = res.data as List? ?? [];
    return list.map((e) {
      final p = e['property'] ?? e;
      return PropertyModel.fromJson(p);
    }).toList();
  }

  Future<bool> toggleFavorite(String id) async {
    try {
      final res = await _dio.post(ApiEndpoints.favoriteToggle(id));
      return res.data['favorited'] ?? true;
    } catch (_) { return false; }
  }

  // ── Criar ────────────────────────────────────────────────────────────────
  Future<PropertyModel> create(Map<String, dynamic> data) async {
    final res = await _dio.post(ApiEndpoints.properties, data: data);
    return PropertyModel.fromJson(res.data);
  }

  // ── Editar ───────────────────────────────────────────────────────────────
  Future<PropertyModel> update(String id, Map<String, dynamic> data) async {
    final res = await _dio.put(ApiEndpoints.property(id), data: data);
    return PropertyModel.fromJson(res.data);
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────
  Future<void> delete(String id) =>
      _dio.delete(ApiEndpoints.property(id));

  // ── Upload de imagem ─────────────────────────────────────────────────────
  Future<String> uploadImage(String filePath) async {
    // XFile.path on web is a blob URL — must use readAsBytes() instead of fromFile()
    final xfile = XFile(filePath);
    final bytes = await xfile.readAsBytes();
    final fileName = filePath.split('/').last.split('\\').last;
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes,
        filename: fileName.isNotEmpty ? fileName : 'image.jpg',
        contentType: DioMediaType('image', 'jpeg')),
    });
    final res = await _dio.post(ApiEndpoints.uploadImage,
      data: formData,
      options: Options(contentType: 'multipart/form-data'));
    return res.data['url'] as String;
  }

  // ── Analytics ────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> analytics(String id) async {
    final res = await _dio.get(ApiEndpoints.propertyAnalytics(id));
    return Map<String, dynamic>.from(res.data);
  }

  // ── Denunciar ────────────────────────────────────────────────────────────
  Future<void> report({required String propertyId, required String motivo, String? descricao}) async {
    await _dio.post(ApiEndpoints.reports, data: {
      'imovel_id': propertyId,
      'motivo': motivo,
      if (descricao != null && descricao.isNotEmpty) 'descricao': descricao,
    });
  }

  // ── Registar lead (interesse) ────────────────────────────────────────────
  Future<void> registerLead({required String propertyId, required String canal}) async {
    await _dio.post(ApiEndpoints.leads, data: {
      'imovel_id': propertyId,
      'canal': canal,
    });
  }

  // ── Pagamento destaque ───────────────────────────────────────────────────
  Future<Map<String, dynamic>> pagarDestaque({required String propertyId, required int dias}) async {
    final res = await _dio.post(ApiEndpoints.destaque, data: {
      'imovel_id': propertyId,
      'dias': dias,
    });
    return Map<String, dynamic>.from(res.data);
  }
}
