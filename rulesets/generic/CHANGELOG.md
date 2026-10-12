# Generic

## 1.4.0

- **Condition bands.** The profile declares how a creature looks as it takes damage, read off
  its Health: Unhurt, Hurt, Badly hurt, Down. A player whose table hides creature numbers sees
  the word instead.
- Additive. Needs app 1.0.0, which knows the field.

## 1.3.0

- **A creature now carries hit points.** The NPC template declares an `hp` field (labelled
  Health, this profile’s own word for it), so importing a person or a stat block reads it and
  a creature added to the combat tracker arrives with its hit points instead of zero.
- Additive: nothing on an existing sheet moves.

## 1.2.1

- Initial registry publication.
