// src/services/media.service.js
const prisma = require("../prisma");

async function getAllMedia() {
  return prisma.media.findMany({
    orderBy: { id: "desc" },
  });
}

async function createMedia(data) {
  if (!data || data.playerId == null) throw new Error("playerId is required");
  if (!data.url) throw new Error("url is required");

  return prisma.media.create({
    data: {
      playerId: Number(data.playerId),
      url: String(data.url),
      type: data.type ? String(data.type) : "image",
      title: data.title ? String(data.title) : null,
    },
  });
}

async function deleteMedia(id) {
  return prisma.media.delete({
    where: { id: Number(id) },
  });
}

module.exports = {
  getAllMedia,
  createMedia,
  deleteMedia,
};
