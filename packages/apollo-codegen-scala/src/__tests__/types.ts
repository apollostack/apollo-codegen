import {
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType
} from "graphql";

import { loadSchema } from "apollo-codegen-core/lib/loading";
const schema = loadSchema(
  require.resolve("../../../../__fixtures__/starwars/schema.json")
);

import { typeNameFromGraphQLType } from "../types";

describe("Scala code generation: Types", function() {
  describe("#typeNameFromGraphQLType()", function() {
    test("should return UndefOr[String] for GraphQLString", function() {
      expect(typeNameFromGraphQLType({ options: {} }, GraphQLString)).toBe(
        "scala.scalajs.js.UndefOr[String]"
      );
    });

    test("should return String for GraphQLNonNull(GraphQLString)", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLNonNull(GraphQLString)
        )
      ).toBe("String");
    });

    test("should return UndefOr[Array[UndefOr[String]]] for GraphQLList(GraphQLString)", function() {
      expect(
        typeNameFromGraphQLType({ options: {} }, new GraphQLList(GraphQLString))
      ).toBe(
        "scala.scalajs.js.UndefOr[scala.scalajs.js.Array[scala.scalajs.js.UndefOr[String]]]"
      );
    });

    test("should return Array[UndefOr[String]] for GraphQLNonNull(GraphQLList(GraphQLString))", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLNonNull(new GraphQLList(GraphQLString))
        )
      ).toBe("scala.scalajs.js.Array[scala.scalajs.js.UndefOr[String]]");
    });

    test("should return UndefOr[Array[String]] for GraphQLList(GraphQLNonNull(GraphQLString))", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLList(new GraphQLNonNull(GraphQLString))
        )
      ).toBe("scala.scalajs.js.UndefOr[scala.scalajs.js.Array[String]]");
    });

    test("should return Array[String] for GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))
        )
      ).toBe("scala.scalajs.js.Array[String]");
    });

    test("should return UndefOr[Array[UndefOr[Array[UndefOr[String]]]]] for GraphQLList(GraphQLList(GraphQLString))", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLList(new GraphQLList(GraphQLString))
        )
      ).toBe(
        "scala.scalajs.js.UndefOr[scala.scalajs.js.Array[scala.scalajs.js.UndefOr[scala.scalajs.js.Array[scala.scalajs.js.UndefOr[String]]]]]"
      );
    });

    test("should return UndefOr[Array[Array[UndefOr[String]]]] for GraphQLList(GraphQLNonNull(GraphQLList(GraphQLString)))", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLList(new GraphQLNonNull(new GraphQLList(GraphQLString)))
        )
      ).toBe(
        "scala.scalajs.js.UndefOr[scala.scalajs.js.Array[scala.scalajs.js.Array[scala.scalajs.js.UndefOr[String]]]]"
      );
    });

    test("should return UndefOr[Int] for GraphQLInt", function() {
      expect(typeNameFromGraphQLType({ options: {} }, GraphQLInt)).toBe(
        "scala.scalajs.js.UndefOr[Int]"
      );
    });

    test("should return UndefOr[Double] for GraphQLFloat", function() {
      expect(typeNameFromGraphQLType({ options: {} }, GraphQLFloat)).toBe(
        "scala.scalajs.js.UndefOr[Double]"
      );
    });

    test("should return UndefOr[Boolean] for GraphQLBoolean", function() {
      expect(typeNameFromGraphQLType({ options: {} }, GraphQLBoolean)).toBe(
        "scala.scalajs.js.UndefOr[Boolean]"
      );
    });

    test("should return UndefOr[String] for GraphQLID", function() {
      expect(typeNameFromGraphQLType({ options: {} }, GraphQLID)).toBe(
        "scala.scalajs.js.UndefOr[String]"
      );
    });

    test("should return UndefOr[String] for a custom scalar type", function() {
      expect(
        typeNameFromGraphQLType(
          { options: {} },
          new GraphQLScalarType({ name: "CustomScalarType", serialize: String })
        )
      ).toBe("scala.scalajs.js.UndefOr[String]");
    });

    test("should return a passed through custom scalar type with the passthroughCustomScalars UndefOr", function() {
      expect(
        typeNameFromGraphQLType(
          {
            options: { passthroughCustomScalars: true, customScalarsPrefix: "" }
          },
          new GraphQLScalarType({ name: "CustomScalarType", serialize: String })
        )
      ).toBe("scala.scalajs.js.UndefOr[CustomScalarType]");
    });

    test("should return a passed through custom scalar type with a prefix with the customScalarsPrefix UndefOr", function() {
      expect(
        typeNameFromGraphQLType(
          {
            options: {
              passthroughCustomScalars: true,
              customScalarsPrefix: "My"
            }
          },
          new GraphQLScalarType({ name: "CustomScalarType", serialize: String })
        )
      ).toBe("scala.scalajs.js.UndefOr[MyCustomScalarType]");
    });
  });
});
