import { db } from "@/db";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import Image from "next/image";

export default async function Page() {
  const delegates = await db.query.user.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
    where: (t, { eq }) => eq(t.role, "delegate"),
    with: {
      region: true,
    },
  });

  const regions = await db.query.regions.findMany({
    orderBy: (t, { asc }) => [asc(t.displayName)],
    with: {
      states: true,
    },
  });

  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-bold">Acerca de</h1>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Regiones en México</h2>
        <div className="flex justify-center">
          <Image
            src="/mapa.png"
            alt="Acerca de"
            width={736}
            height={491}
            className="object-cover"
          />
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Delegado/s sugeridos a cada región de México</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Nombre</TableHead>
              <TableHead>Región</TableHead>
              <TableHead>Correo Electrónico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {delegates.map((delegate) => (
              <TableRow key={delegate.id}>
                <TableCell className="w-16">
                  <Avatar>
                    <AvatarImage
                      src={delegate.image || undefined}
                      alt={delegate.name}
                    />
                    <AvatarFallback>
                      {delegate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <a href={`https://www.worldcubeassociation.org/persons/${delegate.wcaId}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                    {delegate.name}
                  </a>
                </TableCell>
                <TableCell>{delegate.region?.displayName || "N/A"}</TableCell>
                <TableCell>
                  <a href={`mailto:${delegate.email}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {delegate.email}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold">Estados que comprenden cada región</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Región</TableHead>
              <TableHead>Estados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((region) => (
              <TableRow key={region.id}>
                <TableCell>{region.displayName}</TableCell>
                <TableCell>{region.states.map(state => state.name).join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
