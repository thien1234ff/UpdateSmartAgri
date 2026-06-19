// utils/shipping.js

// Hàm bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
  return str
    .normalize("NFD") // chuẩn Unicode
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
}

export const STORE_LOCATION = { lat: 16.51740050007094, lng: 107.48153383448424 }

export async function getLatLngFromAddress(address) {
  if (!address) {
    return {
      success: false,
      error: "Địa chỉ trống",
      input: address,
    }
  }

  const normalized = removeVietnameseTones(address)

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    normalized
  )}&limit=1`

  try {
    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    })

    const data = await resp.json()

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Địa chỉ không hợp lệ hoặc không tìm thấy",
        input: address,
      }
    }

    const { lat, lon } = data[0]
    return {
      success: true,
      lat: Number(lat),
      lng: Number(lon),
      input: address,
    }
  } catch (err) {
    return {
      success: false,
      error: "Lỗi khi gọi API định vị",
      details: err.message,
      input: address,
    }
  }
}


export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
} 

export function calculateShippingFee(subtotal, distanceKm) {
  if (subtotal > 500000) return 0
  if (distanceKm <= 5) return 0
  if (distanceKm <= 10) return 20000
  if (distanceKm <= 20) return 30000
  return 50000
}
