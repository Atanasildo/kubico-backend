class PropertyModel {
  final String id;
  final String titulo;
  final String tipoNegocio;
  final String tipoImovel;
  final double preco;
  final String moeda;
  final String provincia;
  final String municipio;
  final String? bairro;
  final String? enderecoReferencia;
  final double? latitude;
  final double? longitude;
  final double? areaM2;
  final int andares;
  final int quartos;
  final int casasBanho;
  final int cozinhas;
  final int salas;
  final int garagens;
  final int varandas;
  final int despensas;
  final List<String> imagens;
  final bool verificado;
  final bool emDestaque;
  final String? contactoWhatsapp;
  final String? contactoTelefone;
  final bool temEnergia;
  final bool temAgua;
  final bool temGerador;
  final bool temFossaSeptica;
  final bool mobilado;
  final bool temPiscina;
  final bool temQuintal;
  final String pisoTipo;
  final String? descricao;
  final String? autorId;
  final String status;
  final bool aprovado;
  final bool apareceNoFeed;
  final int visualizacoes;
  final DateTime? destaqueAte;
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
    this.enderecoReferencia,
    this.latitude,
    this.longitude,
    this.areaM2,
    this.andares = 0,
    required this.quartos,
    required this.casasBanho,
    this.cozinhas = 0,
    this.salas = 0,
    required this.garagens,
    this.varandas = 0,
    this.despensas = 0,
    required this.imagens,
    required this.verificado,
    required this.emDestaque,
    this.contactoWhatsapp,
    this.contactoTelefone,
    required this.temEnergia,
    required this.temAgua,
    this.temGerador = false,
    this.temFossaSeptica = false,
    required this.mobilado,
    required this.temPiscina,
    required this.temQuintal,
    this.pisoTipo = 'outro',
    this.descricao,
    this.autorId,
    this.status = 'ativo',
    this.aprovado = true,
    this.apareceNoFeed = true,
    this.visualizacoes = 0,
    this.destaqueAte,
    required this.criadoEm,
  });

  bool get isActive => status == 'ativo';
  bool get isSold   => status == 'vendido';
  bool get isRented => status == 'arrendado';

  String get precoFormatado {
    final v = preco >= 1000000
        ? '${(preco / 1000000).toStringAsFixed(1)}M'
        : preco >= 1000
            ? '${(preco / 1000).toStringAsFixed(0)}K'
            : preco.toStringAsFixed(0);
    return '$v $moeda';
  }

  String get localizacao =>
      bairro != null ? '$bairro, $municipio' : municipio;

  String? get thumbUrl => imagens.isNotEmpty ? imagens.first : null;

  factory PropertyModel.fromJson(Map<String, dynamic> j) => PropertyModel(
    id:                 j['id'] ?? '',
    titulo:             j['titulo'] ?? '',
    tipoNegocio:        j['tipo_negocio'] ?? 'venda',
    tipoImovel:         j['tipo_imovel'] ?? 'apartamento',
    preco:              double.tryParse('${j['preco']}') ?? 0,
    moeda:              j['moeda'] ?? 'AOA',
    provincia:          j['provincia'] ?? '',
    municipio:          j['municipio'] ?? '',
    bairro:             j['bairro'],
    enderecoReferencia: j['endereco_referencia'],
    latitude:           j['latitude'] != null ? double.tryParse('${j['latitude']}') : null,
    longitude:          j['longitude'] != null ? double.tryParse('${j['longitude']}') : null,
    areaM2:             j['area_m2'] != null ? double.tryParse('${j['area_m2']}') : null,
    andares:            j['andares'] ?? 0,
    quartos:            j['quartos'] ?? 0,
    casasBanho:         j['casas_banho'] ?? 0,
    cozinhas:           j['cozinhas'] ?? 0,
    salas:              j['salas'] ?? 0,
    garagens:           j['garagens'] ?? 0,
    varandas:           j['varandas'] ?? 0,
    despensas:          j['despensas'] ?? 0,
    imagens:            List<String>.from(j['imagens'] ?? []),
    verificado:         j['verificado'] ?? false,
    emDestaque:         j['em_destaque'] ?? false,
    contactoWhatsapp:   j['contacto_whatsapp'],
    contactoTelefone:   j['contacto_telefone'],
    temEnergia:         j['tem_energia'] ?? false,
    temAgua:            j['tem_agua'] ?? false,
    temGerador:         j['tem_gerador'] ?? false,
    temFossaSeptica:    j['tem_fossa_septica'] ?? false,
    mobilado:           j['mobilado'] ?? false,
    temPiscina:         j['tem_piscina'] ?? false,
    temQuintal:         j['tem_quintal'] ?? false,
    pisoTipo:           j['piso_tipo'] ?? 'outro',
    descricao:          j['descricao'],
    autorId:            j['autor_id'],
    status:             j['status'] ?? 'ativo',
    aprovado:           j['aprovado'] ?? true,
    apareceNoFeed:      j['aparece_no_feed'] ?? true,
    visualizacoes:      j['visualizacoes'] ?? 0,
    destaqueAte:        j['destaque_ate'] != null
        ? DateTime.tryParse(j['destaque_ate']) : null,
    criadoEm:           DateTime.tryParse('${j['criado_em']}') ?? DateTime.now(),
  );

  Map<String, dynamic> toCreateJson() => {
    'titulo': titulo, 'descricao': descricao,
    'tipo_negocio': tipoNegocio, 'tipo_imovel': tipoImovel,
    'preco': preco, 'moeda': moeda,
    'provincia': provincia, 'municipio': municipio,
    if (bairro != null) 'bairro': bairro,
    if (enderecoReferencia != null) 'endereco_referencia': enderecoReferencia,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (areaM2 != null) 'area_m2': areaM2,
    'quartos': quartos, 'casas_banho': casasBanho,
    'cozinhas': cozinhas, 'salas': salas, 'garagens': garagens,
    'tem_energia': temEnergia, 'tem_agua': temAgua,
    'mobilado': mobilado, 'tem_piscina': temPiscina, 'tem_quintal': temQuintal,
    if (contactoWhatsapp != null) 'contacto_whatsapp': contactoWhatsapp,
    if (contactoTelefone != null) 'contacto_telefone': contactoTelefone,
    'imagens': imagens,
  };
}
