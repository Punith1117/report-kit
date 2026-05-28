local function is_newpage_command(command)
  return command:match '^\\newpage *$' or command:match '^\\pagebreak *$'
end

function RawBlock(el)
  if el.format:match('tex') and is_newpage_command(el.text) then
    if FORMAT == 'docx' then
      return pandoc.RawBlock('openxml', '<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
    elseif FORMAT == 'odt' then
      return pandoc.RawBlock('opendocument', '<text:p text:style-name="Pagebreak"/>')
    end
  end
end