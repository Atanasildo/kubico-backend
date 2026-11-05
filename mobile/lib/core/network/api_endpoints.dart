class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String register   = '/auth/register';
  static const String login      = '/auth/login';
  static const String refresh    = '/auth/refresh';
  static const String logout     = '/auth/logout';
  static const String me         = '/users/me';
  static const String updateMe   = '/users/me';

  // Imóveis
  static const String properties = '/properties';
  static String property(String id) => '/properties/$id';

  // Favoritos
  static const String favorites          = '/favorites';
  static String favoriteToggle(String id) => '/favorites/$id';

  // Leads (contacto)
  static const String leads = '/leads';

  // Upload
  static const String uploadImage   = '/uploads/image';
  static const String uploadProfile = '/uploads/profile';

  // Pagamentos
  static const String payments = '/payments';
}
