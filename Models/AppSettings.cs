namespace EmbeddedChat.Models
{
    public class AppSettings
    {
        public string TenantId { get; set; }

        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public string AcsConnectionString { get; set; }

        public string StorageConnectionString { get; set; }
    }
}
