class UserModel {
  final String id;
  final String nome;
  final String email;
  final String? telefone;
  final String role;
  final String? nomeEmpresa;
  final String? fotoPerfil;
  final bool emailVerificado;
  final bool telefoneVerificado;
  final String? provincia;
  final String? municipio;

  const UserModel({
    required this.id,
    required this.nome,
    required this.email,
    this.telefone,
    required this.role,
    this.nomeEmpresa,
    this.fotoPerfil,
    required this.emailVerificado,
    required this.telefoneVerificado,
    this.provincia,
    this.municipio,
  });

  bool get isAgente => role == 'agente' || role == 'admin';
  bool get isAdmin  => role == 'admin';

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id:                 json['id'],
    nome:               json['nome'],
    email:              json['email'],
    telefone:           json['telefone'],
    role:               json['role'],
    nomeEmpresa:        json['nome_empresa'],
    fotoPerfil:         json['foto_perfil_url'],
    emailVerificado:    json['email_verificado'] ?? false,
    telefoneVerificado: json['telefone_verificado'] ?? false,
    provincia:          json['provincia'],
    municipio:          json['municipio'],
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'nome': nome, 'email': email, 'telefone': telefone,
    'role': role, 'nome_empresa': nomeEmpresa, 'foto_perfil_url': fotoPerfil,
    'email_verificado': emailVerificado, 'telefone_verificado': telefoneVerificado,
    'provincia': provincia, 'municipio': municipio,
  };
}
