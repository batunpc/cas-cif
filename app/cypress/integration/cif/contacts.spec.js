describe("The contacts page", () => {
  beforeEach(() => {
    cy.sqlFixture("e2e/dbReset");
    cy.sqlFixture("dev/001_cif_user");
    cy.mockLogin("cif_internal");
  });

  it("Allows creating and editing a contact", () => {
    cy.visit("/cif/contacts");
    cy.get("h2").contains("Contacts");
    cy.get("button").contains("Add").click();
    cy.get("input[aria-label='Given Name']").type("Bob");
    cy.get("input[aria-label='Family Name']").type("Loblaw");
    cy.get("input[aria-label=Email]").type("bob@loblaw.ca");
    cy.get("input[aria-label=Phone]").type("1234567890");
    cy.get("body").happoScreenshot({
      component: "Contact form",
    });
    cy.get("button").contains("Submit").click();
    cy.get("table").contains("Loblaw, Bob");
    cy.get("table").contains("View").click();
    cy.contains("Contact Information");
    cy.get("body").happoScreenshot({
      component: "View contact",
    });
    cy.get("button").contains("Edit").click();
    cy.get("input[aria-label='Given Name']").clear().type("Rob");
    cy.get("button").contains("Submit").click();
    cy.get("table").contains("Loblaw, Rob");
  });
});