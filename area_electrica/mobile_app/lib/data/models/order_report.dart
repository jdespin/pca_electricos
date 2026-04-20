class OrderReport {
  final int? id;
  final int orderId;
  final String observaciones;
  final String materiales;
  final String trabajoRealizado;
  final int createdAt;
  final int updatedAt;

  const OrderReport({
    this.id,
    required this.orderId,
    this.observaciones = '',
    this.materiales = '',
    this.trabajoRealizado = '',
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, Object?> toMap() => {
        'id': id,
        'order_id': orderId,
        'observaciones': observaciones,
        'materiales': materiales,
        'trabajo_realizado': trabajoRealizado,
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  static OrderReport fromMap(Map<String, Object?> map) => OrderReport(
        id: map['id'] as int?,
        orderId: map['order_id'] as int,
        observaciones: map['observaciones'] as String? ?? '',
        materiales: map['materiales'] as String? ?? '',
        trabajoRealizado: map['trabajo_realizado'] as String? ?? '',
        createdAt: map['created_at'] as int,
        updatedAt: map['updated_at'] as int,
      );

  OrderReport copyWith({
    String? observaciones,
    String? materiales,
    String? trabajoRealizado,
  }) =>
      OrderReport(
        id: id,
        orderId: orderId,
        observaciones: observaciones ?? this.observaciones,
        materiales: materiales ?? this.materiales,
        trabajoRealizado: trabajoRealizado ?? this.trabajoRealizado,
        createdAt: createdAt,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      );
}
