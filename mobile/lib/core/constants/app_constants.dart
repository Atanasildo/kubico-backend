class AppConstants {
  AppConstants._();

  static const String baseUrl = 'https://kubico-backend.onrender.com/api/v1';

  // Storage keys
  static const String accessTokenKey = 'kubico_access_token';
  static const String refreshTokenKey = 'kubico_refresh_token';
  static const String userKey = 'kubico_user';

  // Provincias de Angola
  static const List<String> provincias = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
    'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
    'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
    'Namibe', 'Uíge', 'Zaire',
  ];

  // Tipos de imóvel
  static const List<String> tiposImovel = [
    'apartamento', 'vivenda', 'moradia', 'terreno',
    'escritorio', 'loja', 'armazem', 'outro',
  ];

  // Tipos de negócio
  static const List<String> tiposNegocio = ['venda', 'arrendamento'];

  // WhatsApp base
  static const String whatsappBase = 'https://wa.me/244';
}
