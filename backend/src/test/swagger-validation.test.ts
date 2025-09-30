import { swaggerSpec } from '../config/swagger';

describe('Swagger Documentation Validation', () => {
  it('should have valid swagger specification', () => {
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBe('Tourist Rewards System API');
    expect(swaggerSpec.info.version).toBe('1.0.0');
  });

  it('should have restaurant endpoints documented', () => {
    expect(swaggerSpec.paths).toBeDefined();
    
    // Check that key restaurant endpoints are documented
    const paths = swaggerSpec.paths;
    
    // Restaurant registration
    expect(paths['/restaurants/register']).toBeDefined();
    expect(paths['/restaurants/register'].post).toBeDefined();
    
    // Restaurant search endpoints
    expect(paths['/restaurants/search']).toBeDefined();
    expect(paths['/restaurants/search'].get).toBeDefined();
    
    expect(paths['/restaurants/nearby']).toBeDefined();
    expect(paths['/restaurants/nearby'].get).toBeDefined();
    
    expect(paths['/restaurants/search/advanced']).toBeDefined();
    expect(paths['/restaurants/search/advanced'].get).toBeDefined();
    
    // Restaurant details
    expect(paths['/restaurants/details/{placeId}']).toBeDefined();
    expect(paths['/restaurants/details/{placeId}'].get).toBeDefined();
    
    // QR code verification
    expect(paths['/restaurants/qr/verify']).toBeDefined();
    expect(paths['/restaurants/qr/verify'].post).toBeDefined();
    
    // Restaurant listing
    expect(paths['/restaurants']).toBeDefined();
    expect(paths['/restaurants'].get).toBeDefined();
    
    // Restaurant profile
    expect(paths['/restaurants/{id}/profile']).toBeDefined();
    expect(paths['/restaurants/{id}/profile'].get).toBeDefined();
    
    // Utility endpoints
    expect(paths['/restaurants/distance']).toBeDefined();
    expect(paths['/restaurants/distance'].post).toBeDefined();
    
    expect(paths['/restaurants/cache']).toBeDefined();
    expect(paths['/restaurants/cache'].delete).toBeDefined();
  });

  it('should have proper schema definitions', () => {
    expect(swaggerSpec.components).toBeDefined();
    expect(swaggerSpec.components.schemas).toBeDefined();
    
    const schemas = swaggerSpec.components.schemas;
    
    // Check key schemas exist
    expect(schemas.Restaurant).toBeDefined();
    expect(schemas.GoogleRestaurant).toBeDefined();
    expect(schemas.User).toBeDefined();
    expect(schemas.Transaction).toBeDefined();
    expect(schemas.Error).toBeDefined();
    expect(schemas.ValidationError).toBeDefined();
  });

  it('should have security schemes defined', () => {
    expect(swaggerSpec.components.securitySchemes).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(swaggerSpec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });

  it('should have proper response definitions', () => {
    expect(swaggerSpec.components.responses).toBeDefined();
    
    const responses = swaggerSpec.components.responses;
    expect(responses.BadRequest).toBeDefined();
    expect(responses.Unauthorized).toBeDefined();
    expect(responses.NotFound).toBeDefined();
    expect(responses.InternalServerError).toBeDefined();
  });

  it('should have proper tags defined', () => {
    expect(swaggerSpec.tags).toBeDefined();
    expect(Array.isArray(swaggerSpec.tags)).toBe(true);
    
    const tagNames = swaggerSpec.tags.map((tag: any) => tag.name);
    expect(tagNames).toContain('Restaurants');
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('Users');
    expect(tagNames).toContain('Transactions');
    expect(tagNames).toContain('Rankings');
    expect(tagNames).toContain('Dashboard');
    expect(tagNames).toContain('Physical Coins');
  });
});