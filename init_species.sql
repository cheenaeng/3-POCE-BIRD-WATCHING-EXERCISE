DROP TABLE IF EXISTS species;

CREATE TABLE species (id SERIAL PRIMARY KEY, name TEXT, scientific_name TEXT);

INSERT INTO  species(name, scientific_name) VALUES ('King Quail', 'Excalfactoria chinensis'), ('Red Junglefowl	', 'Gallus gallus'), ('Grey Nightjar', 'Caprimulgus jotaka')