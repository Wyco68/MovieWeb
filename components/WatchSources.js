import Image from "next/image";

const SOURCE_GROUPS = [
  { key: "flatrate", label: "Streaming" },
  { key: "free", label: "Free" },
  { key: "ads", label: "With Ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

function resolveRegion(providersByRegion) {
  const regions = Object.keys(providersByRegion || {});

  if (!regions.length) {
    return null;
  }

  if (providersByRegion.US) {
    return "US";
  }

  return regions[0];
}

function getUniqueProviders(regionData) {
  const seen = new Set();

  return SOURCE_GROUPS.map((group) => {
    const providers = (regionData?.[group.key] ?? []).filter((provider) => {
      const key = String(provider?.provider_id || "");

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    return {
      ...group,
      providers,
    };
  }).filter((group) => group.providers.length > 0);
}

export default function WatchSources({ providersByRegion, title = "Where to Watch" }) {
  const region = resolveRegion(providersByRegion);

  if (!region) {
    return null;
  }

  const groupedProviders = getUniqueProviders(providersByRegion?.[region]);

  if (!groupedProviders.length) {
    return null;
  }

  return (
    <section className="mt-8">
      <h3 className="section-title">Available on</h3>

      <div className="space-y-4">
        {groupedProviders.map((group) => {
          return (
            <div key={group.key}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] muted-label">{group.label}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.providers.map((provider) => {
                  return (
                    <div
                      key={provider.provider_id}
                      className="flex items-center gap-2 rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] px-2 py-1.5"
                    >
                      {provider.logo_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={`${provider.provider_name} logo`}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-[6px] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-[6px] bg-slate-200 dark:bg-slate-700" />
                      )}
                      <span className="text-[12px] text-[rgba(0,0,0,0.78)] dark:text-white/84">
                        {provider.provider_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
