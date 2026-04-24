using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Ambev.DeveloperEvaluation.Integration;

internal static class IntegrationJwt
{
    private const string Secret =
        "YourSuperSecretKeyForJwtTokenGenerationThatShouldBeAtLeast32BytesLong";

    public static string CreateToken(string role, Guid? nameId = null)
    {
        var id = nameId ?? Guid.NewGuid();
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
            new Claim(ClaimTypes.Name, "integration-test-user"),
            new Claim(ClaimTypes.Role, role)
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
