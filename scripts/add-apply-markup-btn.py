with open('client/src/pages/admin/AdminProviders.tsx', 'r') as f:
    content = f.read()

# 1. Add applyMarkupToAll mutation hook after existing updateProvider hook
old_hooks = '''  const updateProvider = trpc.admin.providers.update.useMutation({
    onSuccess: () => { toast.success("Provider updated"); utils.admin.providers.list.invalidate(); },
    onError: e => toast.error(e.message)
  });'''

if old_hooks not in content:
    print('ERROR: updateProvider hook not found')
    exit(1)

new_hooks = '''  const updateProvider = trpc.admin.providers.update.useMutation({
    onSuccess: () => { toast.success("Provider updated"); utils.admin.providers.list.invalidate(); },
    onError: e => toast.error(e.message)
  });
  const applyMarkupToAll = trpc.admin.providers.applyMarkupToAll.useMutation({
    onSuccess: (data) => { toast.success(`Markup applied to ${data.updated} products instantly`); utils.admin.providers.list.invalidate(); },
    onError: e => toast.error(e.message),
  });'''

content = content.replace(old_hooks, new_hooks, 1)
print('Step 1: Added applyMarkupToAll mutation hook')

# 2. Replace the Default Markup % input section to add the Apply button
old_markup_section = '''                <div>
                  <Label className="text-slate-400 text-xs mb-1.5 block">Default Markup %</Label>
                  <Input
                    type="number"
                    value={provider.defaultMarkupPercent ?? 20}
                    onChange={e => updateProvider.mutate({ providerKey: provider.providerKey, defaultMarkupPercent: Number(e.target.value) })}
                    className="bg-[#161b22] border-emerald-900/30 text-white focus:border-emerald-500 h-9 text-sm"
                  />
                </div>'''

new_markup_section = '''                <div>
                  <Label className="text-slate-400 text-xs mb-1.5 block">Default Markup %</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={provider.defaultMarkupPercent ?? 20}
                      onChange={e => updateProvider.mutate({ providerKey: provider.providerKey, defaultMarkupPercent: Number(e.target.value) })}
                      className="bg-[#161b22] border-emerald-900/30 text-white focus:border-emerald-500 h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      title="Apply this markup % to all existing products from this provider immediately"
                      className="h-9 text-xs border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 bg-transparent whitespace-nowrap shrink-0"
                      onClick={() => applyMarkupToAll.mutate({ providerKey: provider.providerKey, markupPercent: Number(provider.defaultMarkupPercent ?? 20) })}
                      disabled={applyMarkupToAll.isPending}
                    >
                      {applyMarkupToAll.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply to All"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Updates all existing product prices instantly</p>
                </div>'''

if old_markup_section in content:
    content = content.replace(old_markup_section, new_markup_section, 1)
    print('Step 2: Added Apply to All button to markup input')
else:
    print('ERROR: old markup section not found')
    # Debug
    idx = content.find('Default Markup %')
    print('Default Markup found at:', idx)
    print('Snippet:', content[idx:idx+400])
    exit(1)

with open('client/src/pages/admin/AdminProviders.tsx', 'w') as f:
    f.write(content)
print('SUCCESS: AdminProviders.tsx updated')
