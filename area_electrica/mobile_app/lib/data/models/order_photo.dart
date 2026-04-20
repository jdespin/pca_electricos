class OrderPhoto {
  final int? id;
  final int orderId;
  final String photoPath;
  final double? latitude;
  final double? longitude;
  final int createdAt;

  const OrderPhoto({
    this.id,
    required this.orderId,
    required this.photoPath,
    this.latitude,
    this.longitude,
    required this.createdAt,
  });

  bool get hasLocation => latitude != null && longitude != null;

  String get locationLabel {
    if (!hasLocation) return 'Sin ubicación';
    return '${latitude!.toStringAsFixed(6)}, ${longitude!.toStringAsFixed(6)}';
  }

  Map<String, Object?> toMap() => {
        'id': id,
        'order_id': orderId,
        'photo_path': photoPath,
        'latitude': latitude,
        'longitude': longitude,
        'created_at': createdAt,
      };

  static OrderPhoto fromMap(Map<String, Object?> map) => OrderPhoto(
        id: map['id'] as int?,
        orderId: map['order_id'] as int,
        photoPath: map['photo_path'] as String,
        latitude: map['latitude'] as double?,
        longitude: map['longitude'] as double?,
        createdAt: map['created_at'] as int,
      );
}
