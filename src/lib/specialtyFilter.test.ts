import { test } from "node:test";
import { strict as assert } from "node:assert";
import { matchesSpecialty } from "./specialtyFilter";

test("Klinik Psikolog filtresi yalnız bu kategorideki uzmanları getirir", () => {
  const specialists = [
    { id: "clinical", specialty: "Klinik Psikolog" },
    { id: "psychologist", specialty: "Psikolog" },
    { id: "counselor", specialty: "Psikolojik Danışman" },
  ];
  assert.deepEqual(
    specialists.filter(s => matchesSpecialty(s.specialty, "Klinik Psikolog")).map(s => s.id),
    ["clinical"],
  );
});