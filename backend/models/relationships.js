import sequelize from "../config/database.js";

import Ceremony from "./ceremony.model.js";
import Category from "./category.model.js";
import Film from "./film.model.js";
import Person from "./person.model.js";
import Nomination from "./nomination.model.js";
import NominationFilm from "./nomination_film.model.js";

// Ceremony 1:N Nomination
Ceremony.hasMany(Nomination, {
    foreignKey: "ceremony_id",
    as: "nominations"
});

Nomination.belongsTo(Ceremony, {
    foreignKey: "ceremony_id",
    as: "ceremony"
});

// Category 1:N Nomination
Category.hasMany(Nomination, {
    foreignKey: "category_id",
    as: "nominations"
});

Nomination.belongsTo(Category, {
    foreignKey: "category_id",
    as: "category"
});

// Nomination N:N Film
Nomination.belongsToMany(Film, {
    through: NominationFilm,
    foreignKey: "nomination_id",
    otherKey: "film_id",
    as: "films"
});

Film.belongsToMany(Nomination, {
    through: NominationFilm,
    foreignKey: "film_id",
    otherKey: "nomination_id",
    as: "nominations"
});

// Nomination N:N Person
Nomination.belongsToMany(Person, {
    through: "nomination_person",
    foreignKey: "nomination_id",
    otherKey: "person_id",
    as: "nominees",
    timestamps: false
});

Person.belongsToMany(Nomination, {
    through: "nomination_person",
    foreignKey: "person_id",
    otherKey: "nomination_id",
    as: "nominations",
    timestamps: false
});

export {
    sequelize,
    Ceremony,
    Category,
    Film,
    Person,
    Nomination,
    NominationFilm
};