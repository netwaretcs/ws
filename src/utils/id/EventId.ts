export class EventId {
  public readonly source: string;
  public readonly slug: string;

  public constructor(source: string, slug: string) {
    this.source = source;
    this.slug = slug;
  }

  public static fromString(id: string): EventId {
    const idParts = id.split(':');

    if (idParts.length !== 2 || !idParts[0] || !idParts[1]) {
      throw new Error(`Event ID "${id}" is invalid. Expected format: "source:slug"`);
    }

    return new EventId(idParts[0], idParts[1]);
  }

  public toString(): string {
    return `${this.source}:${this.slug}`;
  }
}
