import mongoose, { Schema, Document } from "mongoose";

export interface IRepository extends Document {
  name: string;
  description?: string;
  typeRepo: "simple" | "creator";
  category?: "personal" | "organizacional" | string;
  privacy?: "public" | "private";
  interestAreas?: string[];
  geoAreas?: string[];
  sectors?: string[];
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  files: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const RepositorySchema = new Schema<IRepository>({
  name: { type: String, required: true },
  description: { type: String },
  typeRepo: { type: String, enum: ["simple", "creator"], required: true },

  // Solo aplican para tipo "simple"
  category: { type: String, enum: ["personal", "organizacional"], required: false },
  privacy: { type: String, enum: ["public", "private"], default: "public" },

  // Solo aplican para tipo "creator"
  interestAreas: [{ type: String }],
  geoAreas: [{ type: String }],
  sectors: [{ type: String }],

  // Comunes
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  files: [{ type: Schema.Types.ObjectId, ref: "File" }],
  createdAt: { type: Date, default: Date.now },
});

// Middleware: limpia campos innecesarios según tipoRepo
RepositorySchema.pre("save", function (next) {
  if (this.typeRepo === "simple") {
    this.interestAreas = [];
    this.geoAreas = [];
    this.sectors = [];
  } else if (this.typeRepo === "creator") {
    this.category = undefined;
    this.privacy = "public";
  }
  next();
});

export default mongoose.model<IRepository>("Repository", RepositorySchema);
