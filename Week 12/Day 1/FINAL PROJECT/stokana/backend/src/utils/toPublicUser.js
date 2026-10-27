function toPublicUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    sellerProfile: row.sellerProfileId
      ? {
          id: Number(row.sellerProfileId),
          shopName: row.shopName,
          shopSlug: row.shopSlug,
          status: row.sellerStatus,
          rejectionReason: row.sellerRejectionReason,
          logoUrl: row.shopLogoUrl
        }
      : null
  };
}

module.exports = { toPublicUser };
