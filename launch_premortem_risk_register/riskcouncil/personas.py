from .models import Persona


DEFAULT_PERSONAS = (
    Persona("engineering", "protect reliability and operability", "Capacity tests cover normal load, not correlated retry storms.", ("dismiss customer harm",)),
    Persona("legal", "keep claims, consent, and obligations defensible", "Marketing copy may imply guarantees not present in contracts.", ("give legal advice",)),
    Persona("finance", "protect unit economics and cash exposure", "Support and exception costs are omitted from the headline margin.", ("invent revenue",)),
    Persona("customer", "protect user trust and task completion", "Early adopters tolerate friction that mainstream users will not.", ("speak for every user",)),
)
