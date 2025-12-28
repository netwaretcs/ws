import { EventId } from './EventId';

describe('EventId', () => {
  it('fromString should parse valid event ID', () => {
    const eventId = EventId.fromString('watchmmafull:ufc-323-event');

    expect(eventId.source).toBe('watchmmafull');
    expect(eventId.slug).toBe('ufc-323-event');
  });

  it('fromString should throw for invalid format', () => {
    expect(() => EventId.fromString('invalid')).toThrow('Event ID "invalid" is invalid');
    expect(() => EventId.fromString('only-one-part')).toThrow();
    expect(() => EventId.fromString('too:many:parts')).toThrow();
  });

  it('toString should format correctly', () => {
    const eventId = new EventId('fullfightreplays', 'ufc-300-pereira-vs-hill');

    expect(eventId.toString()).toBe('fullfightreplays:ufc-300-pereira-vs-hill');
  });
});
