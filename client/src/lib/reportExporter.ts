import { jsPDF } from "jspdf";
import type { ModelResponse } from "@/components/ComparisonGrid";
import type { CaesarResponse } from "@/components/CaesarCard";

interface ReportData {
  prompt: string;
  responses: ModelResponse[];
  modelNames: { [modelId: string]: string };
  caesar?: CaesarResponse;
  blindMode?: boolean;
  timestamp?: Date;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

export function generatePDF(data: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("LLM Arena Comparison Report", margin, yPos);
  yPos += 12;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  const timestamp = data.timestamp || new Date();
  doc.text(`Generated: ${timestamp.toLocaleString()}`, margin, yPos);
  yPos += 8;
  
  if (data.blindMode) {
    doc.setTextColor(147, 51, 234);
    doc.text("Blind Mode Comparison", margin, yPos);
    yPos += 8;
  }
  
  doc.setTextColor(0, 0, 0);
  yPos += 8;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Prompt", margin, yPos);
  yPos += 8;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const promptLines = wrapText(doc, data.prompt, contentWidth);
  for (const line of promptLines) {
    checkPageBreak(6);
    doc.text(line, margin, yPos);
    yPos += 6;
  }
  yPos += 10;

  const validResponses = data.responses.filter(r => r.response && !r.error);
  
  for (let i = 0; i < validResponses.length; i++) {
    const response = validResponses[i];
    const modelName = data.modelNames[response.modelId] || response.modelId;
    
    checkPageBreak(30);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Response ${i + 1}: ${modelName}`, margin, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    const metaInfo: string[] = [];
    if (response.generationTime) {
      metaInfo.push(`${response.generationTime}ms`);
    }
    if (response.tokenCount) {
      metaInfo.push(`~${response.tokenCount} tokens`);
    }
    if (metaInfo.length > 0) {
      doc.text(metaInfo.join(" | "), margin, yPos);
      yPos += 6;
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const responseLines = wrapText(doc, response.response || '', contentWidth);
    for (const line of responseLines) {
      checkPageBreak(5);
      doc.text(line, margin, yPos);
      yPos += 5;
    }
    yPos += 10;
  }

  if (data.caesar?.verdict) {
    checkPageBreak(60);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 119, 6);
    doc.text("Caesar's Verdict", margin, yPos);
    yPos += 10;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    const winnerLabel = data.caesar.verdict.winner;
    let winnerName: string = winnerLabel;
    if (winnerLabel !== "Tie" && data.caesar.modelMapping[winnerLabel]) {
      const modelId = data.caesar.modelMapping[winnerLabel];
      winnerName = data.modelNames[modelId] || modelId;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text(`Winner: ${winnerName}`, margin, yPos);
    yPos += 7;
    
    doc.setFont("helvetica", "normal");
    const confidence = (data.caesar.verdict.confidence * 100).toFixed(0);
    doc.text(`Confidence: ${confidence}%`, margin, yPos);
    yPos += 7;
    
    doc.text(`Judge: ${data.caesar.judgeModel}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    const verdictLines = wrapText(doc, `"${data.caesar.verdict.one_line_verdict}"`, contentWidth);
    for (const line of verdictLines) {
      checkPageBreak(6);
      doc.text(line, margin, yPos);
      yPos += 6;
    }
    yPos += 8;
    
    if (data.caesar.verdict.detailed_reasoning && data.caesar.verdict.detailed_reasoning.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Reasoning:", margin, yPos);
      yPos += 6;
      
      doc.setFont("helvetica", "normal");
      for (const reason of data.caesar.verdict.detailed_reasoning) {
        const reasonLines = wrapText(doc, `• ${reason}`, contentWidth - 5);
        for (const line of reasonLines) {
          checkPageBreak(5);
          doc.text(line, margin + 5, yPos);
          yPos += 5;
        }
      }
      yPos += 8;
    }
    
    if (data.caesar.verdict.scores && Object.keys(data.caesar.verdict.scores).length > 0) {
      checkPageBreak(40);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Score Breakdown:", margin, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      for (const [label, scores] of Object.entries(data.caesar.verdict.scores)) {
        const modelId = data.caesar.modelMapping[label];
        const modelName = data.modelNames[modelId] || modelId || label;
        
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.text(`${modelName}:`, margin + 5, yPos);
        yPos += 5;
        
        doc.setFont("helvetica", "normal");
        const scoreText = `Accuracy: ${scores.accuracy}/10 | Clarity: ${scores.clarity}/10 | Creativity: ${scores.creativity}/10 | Safety: ${scores.safety}/10 | Overall: ${scores.overall}/10`;
        const scoreLines = wrapText(doc, scoreText, contentWidth - 10);
        for (const line of scoreLines) {
          doc.text(line, margin + 10, yPos);
          yPos += 5;
        }
        yPos += 3;
      }
    }
  }

  checkPageBreak(15);
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Generated by LLM Arena - Privacy-first LLM comparison platform", margin, yPos);
  
  const fileName = `llm-arena-report-${Date.now()}.pdf`;
  doc.save(fileName);
}

export function generateMarkdown(data: ReportData): string {
  const timestamp = data.timestamp || new Date();
  let md = `# LLM Arena Comparison Report\n\n`;
  md += `**Generated:** ${timestamp.toLocaleString()}\n\n`;
  
  if (data.blindMode) {
    md += `> *Blind Mode Comparison*\n\n`;
  }
  
  md += `---\n\n`;
  md += `## Prompt\n\n`;
  md += `${data.prompt}\n\n`;
  md += `---\n\n`;

  const validResponses = data.responses.filter(r => r.response && !r.error);
  
  md += `## Model Responses\n\n`;
  
  for (let i = 0; i < validResponses.length; i++) {
    const response = validResponses[i];
    const modelName = data.modelNames[response.modelId] || response.modelId;
    
    md += `### ${i + 1}. ${modelName}\n\n`;
    
    const metaInfo: string[] = [];
    if (response.generationTime) {
      metaInfo.push(`**Time:** ${response.generationTime}ms`);
    }
    if (response.tokenCount) {
      metaInfo.push(`**Tokens:** ~${response.tokenCount}`);
    }
    if (metaInfo.length > 0) {
      md += `${metaInfo.join(" | ")}\n\n`;
    }
    
    md += `${response.response}\n\n`;
    md += `---\n\n`;
  }

  if (data.caesar?.verdict) {
    md += `## Caesar's Verdict\n\n`;
    
    const winnerLabel = data.caesar.verdict.winner;
    let winnerName: string = winnerLabel;
    if (winnerLabel !== "Tie" && data.caesar.modelMapping[winnerLabel]) {
      const modelId = data.caesar.modelMapping[winnerLabel];
      winnerName = data.modelNames[modelId] || modelId;
    }
    
    md += `**Winner:** ${winnerName}\n\n`;
    md += `**Confidence:** ${(data.caesar.verdict.confidence * 100).toFixed(0)}%\n\n`;
    md += `**Judge Model:** ${data.caesar.judgeModel}\n\n`;
    md += `> *"${data.caesar.verdict.one_line_verdict}"*\n\n`;
    
    if (data.caesar.verdict.detailed_reasoning && data.caesar.verdict.detailed_reasoning.length > 0) {
      md += `### Detailed Reasoning\n\n`;
      for (const reason of data.caesar.verdict.detailed_reasoning) {
        md += `- ${reason}\n`;
      }
      md += `\n`;
    }
    
    if (data.caesar.verdict.scores && Object.keys(data.caesar.verdict.scores).length > 0) {
      md += `### Score Breakdown\n\n`;
      md += `| Model | Accuracy | Clarity | Creativity | Safety | Overall |\n`;
      md += `|-------|----------|---------|------------|--------|--------|\n`;
      
      for (const [label, scores] of Object.entries(data.caesar.verdict.scores)) {
        const modelId = data.caesar.modelMapping[label];
        const modelName = data.modelNames[modelId] || modelId || label;
        md += `| ${modelName} | ${scores.accuracy}/10 | ${scores.clarity}/10 | ${scores.creativity}/10 | ${scores.safety}/10 | ${scores.overall}/10 |\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;
  md += `*Generated by [LLM Arena](/) - Privacy-first LLM comparison platform*\n`;
  
  return md;
}

export function downloadMarkdown(data: ReportData): void {
  const markdown = generateMarkdown(data);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `llm-arena-report-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: ReportData): void {
  const timestamp = data.timestamp || new Date();
  
  const validResponses = data.responses.filter(r => r.response && !r.error);
  
  const exportData = {
    platform: "LLM Arena",
    generatedAt: timestamp.toISOString(),
    blindMode: data.blindMode || false,
    prompt: data.prompt,
    responses: validResponses.map(r => ({
      modelId: r.modelId,
      modelName: data.modelNames[r.modelId] || r.modelId,
      response: r.response,
      generationTime: r.generationTime,
      tokenCount: r.tokenCount,
    })),
    caesar: data.caesar?.verdict ? {
      winner: data.caesar.verdict.winner,
      winnerModelName: data.caesar.verdict.winner !== "Tie" && data.caesar.modelMapping[data.caesar.verdict.winner]
        ? data.modelNames[data.caesar.modelMapping[data.caesar.verdict.winner]] || data.caesar.modelMapping[data.caesar.verdict.winner]
        : data.caesar.verdict.winner,
      confidence: data.caesar.verdict.confidence,
      oneLineVerdict: data.caesar.verdict.one_line_verdict,
      detailedReasoning: data.caesar.verdict.detailed_reasoning,
      scores: data.caesar.verdict.scores,
      judgeModel: data.caesar.judgeModel,
    } : null,
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `llm-arena-report-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
