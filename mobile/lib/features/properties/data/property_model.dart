class PropertyModel {
  final String id;
  final String titulo;
  final String tipoNegocio;   // venda | arrendamento
  final String tipoImovel;
  final double preco;
  final String moeda;         // AOA | USD
  final String provincia;
  final String municipio;
  final String? bairro;
  final double? areaM2;
  final int quartos;
  final int casasBanho;
  final int garagens;
  final List<String> imagens;
  final bool verificado;
  final bool emDestaque;
  final String? contactoWhatsapp;
  final String? contactoTelefone;
  final bool temEnergia;
  final bool temAgua;
  final bool mobilado;
  final bool temPiscina;
  final bool temQuintal;
  final String? descricao;
  final String? autorId;
  final DateTime criadoEm;

  const PropertyModel({
    required this.id,
    required this.titulo,
    required this.tipoNegocio,
    required this.tipoImovel,
    required this.preco,
    required this.moeda,
    required this.provincia,
    required this.municipio,
    this.bairro,
    this.areaM2,
    required this.quartos,
    required this.casasBanho,
    required this.garagens,
    required this.imagens,
    required this.verificado,
    required this.emDestaque,
    this.contactoWhatsapp,
    this.contactoTelefone,
    required this.temEnergia,
    required this.temAgua,
    required this.mobilado,
    required this.temPiscina,
    required this.temQuintal,
    this.descricao,
    this.autorId,
    required this.criadoEm,
  });

  String get precoFormatado {
    final val = preco >= 1000000
        ? '${(preco / 1000000).toStringAsFixed(1)}M'
        : preco >= 1000
            ? '${(preco / 1000).toStringAsFixed(0)}K'
            : preco.toStringAsFixed(0);
    return '$val $moeda';
  }

  String get localizacao => bairro != null ? '$bairro, $municipio' : municipio;

  String? get thumbUrl => imagens.isNotEmpty ? imagens.first : null;

  factory PropertyModel.fromJson(Map<String, dynamic> json) => PropertyModel(
    id:                json['id'],
    titulo:            json['titulo'],
    tipoNegocio:       json['tipo_negocio'],
    tipoImovel:        json['tipo_imovel'],
    preco:             double.tryParse(json['preco'].toString()) ?? 0,
    moeda:             json['moeda'] ?? 'AOA',
    provincia:         json['provincia'],
    municipio:         json['municipio'],
    bairro:            json['bairro'],
    areaM2:            json['area_m2'] != null ? double.tryParse(json['area_m2'].toString()) : null,
    quartos:           json['quartos'] ?? 0,
    casasBanho:        json['casas_banho'] ?? 0,
    garagens:          json['garagens'] ?? 0,
    imagens:           List<String>.from(json['imagens'] ?? []),
    verificado:        json['verificado'] ?? false,
    emDestaque:        json['em_destaque'] ?? false,
    contactoWhatsapp:  json['contacto_whatsapp'],
    contactoTelefone:  json['contacto_telefone'],
    temEnergia:        json['tem_energia'] ?? false,
    temAgua:           json['tem_agua'] ?? false,
    mobilado:          json['mobilado'] ?? false,
    temPiscina:        json['tem_piscina'] ?? false,
    temQuintal:        json['tem_quintal'] ?? false,
    descricao:         json['descricao'],
    autorId:           json['autor_id'],
    criadoEm:          DateTime.tryParse(json['criado_em'] ?? '') ?? DateTime.now(),
  );
}
